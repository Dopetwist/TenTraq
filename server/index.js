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

const { Pool } = pkg;

env.config();

const app = express();
const port = process.env.PORT || 5000;
const authSecret = process.env.AUTH_SECRET || "local-development-secret-change-me";
const scrypt = promisify(scryptCallback);

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

/* const createLandlordsTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS landlords (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(120) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            secret_word VARCHAR(120) NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await db.query("ALTER TABLE landlords ADD COLUMN IF NOT EXISTS secret_word VARCHAR(120) NOT NULL DEFAULT ''");
}; */

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

// Authentication Endpoints
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
app.post("/api/tenants", async (req, res) => {
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
            lease_end_date
        } = req.body;

        const result = await db.query(
            `INSERT INTO tenants 
                (full_name, email, phone, property_id, room_number, rent_amount, lease_start_date, lease_end_date, status, currency)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [full_name, email, phone, property, room, rent, lease_start_date, lease_end_date, initialStatus, currency]
        );

        res.status(201).json(result.rows[0]); // return created tenant
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
            )
            SELECT
                (SELECT COUNT(*)::int FROM landlord_properties) AS total_properties,
                (SELECT COUNT(*)::int FROM landlord_tenants) AS total_tenants,
                0::int AS documents_uploaded,
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
            documentsUploaded: dashboard.documents_uploaded,
            recentTenants: dashboard.recent_tenants
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Email endpoint
app.post("/api/send-email", async (req, res) => {

});


// Document endpoint
app.post("/api/upload-document", async (req, res) => {

});


// Server listener
/* createLandlordsTable()
    .then(() => console.log("Landlords table is ready"))
    .catch((error) => console.error("Unable to initialize landlords table:", error.message));
*/

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});