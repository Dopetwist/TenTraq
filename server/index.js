import express from "express";
import env from "dotenv";
import cors from "cors";
import pkg from "pg";
import pg from "pg";
import {
    createHmac,
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const { Pool } = pkg;

env.config();

const app = express();
const port = process.env.PORT || 5000;
const authSecret = process.env.AUTH_SECRET || "local-development-secret-change-me";
const scrypt = promisify(scryptCallback);

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "document_uploads",
        resource_type: "auto", // allows images, PDFs, etc.
    },
});

const upload = multer({ storage }); // Multer middleware for handling file uploads

// Prevent backend date timezone shifts
pg.types.setTypeParser(1082, (val) => val);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("client/dist")); // server serves react for deployment


// Database Connection
const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

db.connect()
    .then(() => console.log("Connected to PostgreSQL database"))
    .catch((err) => console.error("Database connection error:", err.stack));


// Authentication Utilities
const hashPassword = async (password) => {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
};

const verifyPassword = async (password, storedHash) => {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;

    const derivedKey = await scrypt(password, salt, 64);
    const storedKey = Buffer.from(key, "hex");
    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
};

const createToken = (landlord) => {
    const payload = Buffer.from(JSON.stringify({
        id: landlord.id,
        email: landlord.email,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days in milliseconds
    })).toString("base64url");
    const signature = createHmac("sha256", authSecret).update(payload).digest("base64url");
    return `${payload}.${signature}`;
};

const readToken = (token) => {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expectedSignature = createHmac("sha256", authSecret).update(payload).digest("base64url");
    const received = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Date.now() ? data : null;
};

const getAuthToken = (req) => {
    const header = req.headers.authorization || "";
    return header.startsWith("Bearer ") ? header.slice(7) : null;
};

const getAuthenticatedClaims = (req) => {
    const token = getAuthToken(req);
    if (!token) return null;
    try {
        return readToken(token);
    } catch {
        return null;
    }
};

// Authentication Endpoints

// register user
app.post("/api/auth/register", async (req, res) => {
    const fullName = req.body.full_name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const secretWord = req.body.secret_word?.trim();

    if (!fullName || !email || !password || password.length < 8 || !secretWord) {
        return res.status(400).json({ error: "Name, email, password, and a secret word are required." });
    }

    try {
        const passwordHash = await hashPassword(password);
        const result = await db.query(
            `INSERT INTO landlords (full_name, email, password_hash, secret_word)
             VALUES ($1, $2, $3, $4) RETURNING id, full_name, email`,
            [fullName, email, passwordHash, secretWord]
        );
        const landlord = result.rows[0];
        res.status(201).json({ landlord, token: createToken(landlord) });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ error: "An account with that email already exists." });
        }
        console.error(error);
        res.status(500).json({ error: "Unable to create your account right now." });
    }
});

// login user
app.post("/api/auth/login", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const result = await db.query(
            "SELECT id, full_name, email, password_hash FROM landlords WHERE email = $1",
            [email]
        );
        const landlord = result.rows[0];
        if (!landlord || !(await verifyPassword(password, landlord.password_hash))) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const safeLandlord = {
            id: landlord.id,
            full_name: landlord.full_name,
            email: landlord.email
        };
        res.json({ landlord: safeLandlord, token: createToken(safeLandlord) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unable to sign in right now." });
    }
});

// reset password
app.post("/api/auth/reset-password", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const secretWord = req.body.secret_word?.trim();
    const password = req.body.password;

    if (!email || !secretWord || !password || password.length < 8) {
        return res.status(400).json({ error: "Email, secret word, and a password of at least 8 characters are required." });
    }

    try {
        const result = await db.query(
            "SELECT id, secret_word FROM landlords WHERE email = $1",
            [email]
        );
        const landlord = result.rows[0];
        if (!landlord || landlord.secret_word !== secretWord) {
            return res.status(401).json({ error: "The email or secret word is incorrect." });
        }

        const passwordHash = await hashPassword(password);
        await db.query(
            "UPDATE landlords SET password_hash = $1 WHERE id = $2",
            [passwordHash, landlord.id]
        );
        res.json({ message: "Your password has been updated. You can now sign in." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unable to reset your password right now." });
    }
});

// authenticated user
app.get("/api/auth/me", async (req, res) => {
    try {
        const token = getAuthToken(req);
        const claims = token && readToken(token);
        if (!claims) return res.status(401).json({ error: "Authentication required." });

        const result = await db.query(
            "SELECT id, full_name, email FROM landlords WHERE id = $1",
            [claims.id]
        );
        if (result.rows.length === 0) return res.status(401).json({ error: "Account not found." });
        res.json({ landlord: result.rows[0] });
    } catch (error) {
        res.status(401).json({ error: "Invalid authentication token." });
    }
});

// edit landlord name
app.put("/api/landlords/edit/:id", async (req, res) => {

    const { id } = req.params;
    const claims = getAuthenticatedClaims(req);
    const fullName = req.body.full_name?.trim();

    if (!claims || String(claims.id) !== String(id)) {
        return res.status(401).json({ error: "Authentication required." });
    }
    if (!fullName) {
        return res.status(400).json({ error: "Name cannot be empty." });
    }

    try {
        const result = await db.query(
            "UPDATE landlords SET full_name = $1 WHERE id = $2 RETURNING id, full_name, email",
            [fullName, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Landlord not found." });
        }

        res.json({ landlord: result.rows[0] });
    } catch (error) {
        console.error("Error updating landlord name", error.message);
        res.status(500).json({ error: "Failed to update landlord name!" });
    }
});

// update landlord email after secret-word verification
app.put("/api/landlords/email", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    const email = req.body.email?.trim().toLowerCase();
    const secretWord = req.body.secret_word?.trim();

    if (!claims) return res.status(401).json({ error: "Authentication required." });
    if (!email || !secretWord) {
        return res.status(400).json({ error: "Email and secret word are required." });
    }

    try {
        const landlordResult = await db.query(
            "SELECT secret_word FROM landlords WHERE id = $1",
            [claims.id]
        );
        const landlord = landlordResult.rows[0];
        if (!landlord) return res.status(404).json({ error: "Landlord not found." });
        if (landlord.secret_word !== secretWord) {
            return res.status(401).json({ error: "Wrong secret word." });
        }

        const result = await db.query(
            "UPDATE landlords SET email = $1 WHERE id = $2 RETURNING id, full_name, email",
            [email, claims.id]
        );
        res.json({ landlord: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ error: "An account with that email already exists." });
        }
        console.error("Error updating landlord email", error.message);
        res.status(500).json({ error: "Failed to update email." });
    }
});

// change landlord password after verifying the current password
app.put("/api/landlords/password", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    const { old_password: oldPassword, new_password: newPassword, confirm_password: confirmPassword } = req.body;

    if (!claims) return res.status(401).json({ error: "Authentication required." });
    if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "All password fields are required." });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters." });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "New passwords do not match." });
    }

    try {
        const result = await db.query(
            "SELECT password_hash FROM landlords WHERE id = $1",
            [claims.id]
        );
        const landlord = result.rows[0];
        if (!landlord) return res.status(404).json({ error: "Landlord not found." });
        if (!(await verifyPassword(oldPassword, landlord.password_hash))) {
            return res.status(401).json({ error: "Old password is incorrect." });
        }

        await db.query("UPDATE landlords SET password_hash = $1 WHERE id = $2", [
            await hashPassword(newPassword),
            claims.id
        ]);
        res.json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error updating landlord password", error.message);
        res.status(500).json({ error: "Failed to update password." });
    }
});

// permanently delete a landlord after verifying both credentials
app.delete("/api/landlords/account", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    const secretWord = req.body.secret_word?.trim();
    const password = req.body.password;

    if (!claims) return res.status(401).json({ error: "Authentication required." });
    if (!secretWord || !password) {
        return res.status(400).json({ error: "Secret word and password are required." });
    }

    const client = await db.connect();
    try {
        const landlordResult = await client.query(
            "SELECT secret_word, password_hash FROM landlords WHERE id = $1",
            [claims.id]
        );
        const landlord = landlordResult.rows[0];
        if (!landlord) return res.status(404).json({ error: "Landlord not found." });
        if (landlord.secret_word !== secretWord) {
            return res.status(401).json({ error: "Wrong secret word." });
        }
        if (!(await verifyPassword(password, landlord.password_hash))) {
            return res.status(401).json({ error: "Password is incorrect." });
        }

        await client.query("BEGIN");
        await client.query(
            "DELETE FROM documents WHERE tenant_id IN (SELECT tenants.id FROM tenants JOIN properties ON properties.id = tenants.property_id WHERE properties.landlord_id = $1)",
            [claims.id]
        );
        await client.query(
            "DELETE FROM tenants WHERE property_id IN (SELECT id FROM properties WHERE landlord_id = $1)",
            [claims.id]
        );
        await client.query("DELETE FROM properties WHERE landlord_id = $1", [claims.id]);
        const result = await client.query("DELETE FROM landlords WHERE id = $1", [claims.id]);
        await client.query("COMMIT");

        if (result.rowCount === 0) return res.status(404).json({ error: "Landlord not found." });
        res.json({ message: "Account deleted successfully." });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error deleting landlord account", error.message);
        res.status(500).json({ error: "Failed to delete account." });
    } finally {
        client.release();
    }
});


// Tenants endpoints

// get all tenants details
app.get("/api/tenants", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM tenants");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get a single tenant details
app.get("/api/tenants/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT * FROM tenants 
            LEFT JOIN properties
            ON tenants.property_id = properties.id
            WHERE tenants.id = $1`, 
        [id]);

        // If tenant doesn't exist
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tenant not found!" });
        }

        res.json(result.rows[0]); // return single tenant
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
});

// register a new tenant
app.post("/api/tenants", upload.single("document"), async (req, res) => {
    try {
        const initialStatus = "active"; // default status for new tenants

        const { 
            full_name, 
            email, 
            phone,
            property,
            room,
            currency,
            rent,
            lease_start_date,
            lease_end_date,
            document_title
        } = req.body;

        // Access the uploaded file
        const documentUrl = req.file ? req.file.path : null; // Cloudinary URL of the uploaded document

        // Validate required fields
        if (!full_name || !email || !phone || !property || !room || !currency || !rent || !lease_start_date || !lease_end_date || !document_title || !documentUrl) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const result = await db.query(
            `INSERT INTO tenants (
                full_name, email, phone, property_id, room_number, rent_amount, 
                lease_start_date, lease_end_date, status, currency
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [full_name, email, phone, property, room, rent, lease_start_date, lease_end_date, initialStatus, currency]
        );

        const newTenant = result.rows[0];

        await db.query(`INSERT INTO documents (document_title, document_url, tenant_id) VALUES ($1, $2, $3)`, [document_title, documentUrl, newTenant.id]);

        res.status(201).json(newTenant); // return created tenant
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// edit a tenant
app.put("/api/tenants/edit/:id", async (req, res) => {
    const { id } = req.params;

    const {
        full_name,
        email,
        phone,
        property,
        room,
        currency,
        rent,
        status,
        lease_start_date,
        lease_end_date
    } = req.body;

    try {
        await db.query(`UPDATE tenants SET 
            full_name = $1, email = $2, phone = $3, property_id = $4, room_number = $5, 
            rent_amount = $6, lease_start_date = $7, lease_end_date = $8, status = $9, currency = $10
            WHERE tenants.id = $11
            `, [full_name, email, phone, property, room, rent, lease_start_date, lease_end_date, status, currency, id]);

        res.status(200).json({ message: "Tenant updated successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Failed to update tenant" });
    }
});

// delete a tenant
app.delete("/api/tenants/:id", async (req, res) => {
    
    const { id } = req.params;

    try {
        const result = await db.query("DELETE FROM tenants WHERE tenants.id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Tenant not found!" });
        }

        res.status(200).json({ message: "Tenant deleted successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete tenant" });
    }
});


// Properties endpoints

// get all properties
app.get("/api/properties", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM properties");
        const properties = result.rows;
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// add properties
app.post("/api/properties", async (req, res) => {
    try {
        const token = getAuthToken(req);
        const claims = token && readToken(token);
        if (!claims) return res.status(401).json({ error: "Authentication required." });

        const { property_name, address } = req.body;
        if (!property_name?.trim() || !address?.trim()) {
            return res.status(400).json({ error: "Property name and address are required." });
        }

        const result = await db.query(
            "INSERT INTO properties (landlord_id, property_name, property_address) VALUES ($1, $2, $3) RETURNING *",
            [claims.id, property_name.trim(), address.trim()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get landlord dashboard data
app.get("/api/landlords/:id", async (req, res) => {

    const { id } = req.params;

    try {
        const query = `WITH landlord_properties AS (
                SELECT id, property_name
                FROM properties
                WHERE landlord_id = $1
            ), landlord_tenants AS (
                SELECT tenants.id, tenants.full_name, tenants.email, tenants.property_id,
                       landlord_properties.property_name
                FROM tenants
                INNER JOIN landlord_properties ON landlord_properties.id = tenants.property_id
            ), tenants_documents AS (
                SELECT documents.id, documents.document_title, documents.document_url, documents.tenant_id,
                landlord_tenants.id
                FROM documents
                INNER JOIN landlord_tenants ON landlord_tenants.id = documents.tenant_id
            ) SELECT
                (SELECT COUNT(*)::int FROM landlord_properties) AS total_properties,
                (SELECT COUNT(*)::int FROM landlord_tenants) AS total_tenants,
                (SELECT COUNT(*)::int FROM tenants_documents) AS total_documents,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', id,
                            'fullName', full_name,
                            'email', email,
                            'propertyId', property_id,
                            'propertyName', property_name
                        ) ORDER BY id DESC
                    ) FROM (
                        SELECT * FROM landlord_tenants
                        ORDER BY id DESC
                        LIMIT 5
                    ) recent_tenants),
                    '[]'::json
                ) AS recent_tenants`;

        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Landlord not found." });
        }

        const dashboard = result.rows[0];
        res.json({
            totalTenants: dashboard.total_tenants,
            totalProperties: dashboard.total_properties,
            totalDocuments: dashboard.total_documents,
            recentTenants: dashboard.recent_tenants
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/user/")


// Document endpoint

// get a selected tenant's documents
app.get("/api/documents/:tenantId", async (req, res) => {
    try {
        const { tenantId } = req.params;
        
        const result = await db.query("SELECT * FROM documents WHERE tenant_id = $1", [tenantId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// upload a new document
app.post("/api/documents/upload", upload.single("document"), async (req, res) => {
    try {
        const token = getAuthToken(req);
        const claims = token && readToken(token);
        if (!claims) return res.status(401).json({ error: "Authentication required." });

        const { document_title, tenant_id } = req.body;
        
        if (!document_title?.trim()) {
            return res.status(400).json({ error: "Document name is required." });
        }
        if (!tenant_id) {
            return res.status(400).json({ error: "Tenant is required." });
        }

        // Access the uploaded file
        const documentUrl = req.file ? req.file.path : null; // Cloudinary URL of the uploaded document


        const result = await db.query(
            "INSERT INTO documents (document_title, document_url, tenant_id) VALUES ($1, $2, $3) RETURNING *",
            [document_title.trim(), documentUrl, tenant_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Document upload error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again!" });
    }
});

// delete a document
app.delete("/api/documents/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query("DELETE FROM documents WHERE documents.id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Document not found!" });
        }

        res.status(200).json({ message: "Document deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Email endpoint
app.post("/api/send-email", async (req, res) => {

});


// Server listener
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});