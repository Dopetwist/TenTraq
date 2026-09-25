import express from "express";
import env from "dotenv";
import cors from "cors";
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
import db from "./config/db.js";
import { processRentReminders, startRentReminderScheduler } from "./services/rentReminderService.js";

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

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("client/dist")); // server serves react for deployment


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

const paymentMethods = new Set(["cash", "bank_transfer", "pos", "online", "other"]);

const isValidId = (value) => /^\d+$/.test(String(value || ""));

const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isValidAmount = (value) => /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(String(value || "")) && value !== "0" && value !== "0.00";

const serializeObligation = (row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    propertyName: row.property_name,
    amountDue: row.amount_due,
    amountPaid: row.amount_paid || "0",
    outstanding: row.outstanding,
    dueDate: row.due_date,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at
});

const serializePayment = (row) => ({
    id: row.id,
    rentObligationId: row.rent_obligation_id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    propertyName: row.property_name,
    amount: row.amount,
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,
    reference: row.reference,
    notes: row.notes,
    status: row.status,
    recordedBy: row.recorded_by_name,
    createdAt: row.created_at
});

const obligationSelect = `
    SELECT 
        ros.id, 
        ros.tenant_id, 
        t.full_name AS tenant_name,
        p.property_name, 
        ros.amount_due, 
        ros.amount_paid,
        (ros.amount_due - ros.amount_paid) AS outstanding,
        ros.due_date, 
        ros.period_start, 
        ros.period_end,
           CASE WHEN ros.amount_paid >= ros.amount_due THEN 'paid'
                WHEN ros.amount_paid > 0 THEN CASE WHEN ros.due_date < CURRENT_DATE THEN 'overdue' ELSE 'partial' END
                WHEN ros.due_date < CURRENT_DATE THEN 'overdue'
                ELSE 'unpaid' END AS status,
           ros.notes, ros.created_at
    FROM rent_obligation_summary ros
    INNER JOIN tenants t ON t.id = ros.tenant_id
    INNER JOIN properties p ON p.id = t.property_id
    WHERE p.landlord_id = $1`;

const paymentSelect = `
    SELECT pay.id, pay.rent_obligation_id, pay.tenant_id, t.full_name AS tenant_name,
           p.property_name, pay.amount, pay.payment_date, pay.payment_method,
           pay.reference, pay.notes, pay.status, pay.created_at,
           recorder.full_name AS recorded_by_name
    FROM payments pay
    INNER JOIN tenants t ON t.id = pay.tenant_id
    INNER JOIN properties p ON p.id = t.property_id
    LEFT JOIN landlords recorder ON recorder.id = pay.recorded_by
    WHERE p.landlord_id = $1`;

const refreshObligationStatus = async (client, obligationId) => {
    const result = await client.query(
        `UPDATE rent_obligations ro
         SET status = CASE
             WHEN COALESCE((SELECT SUM(amount) FROM payments WHERE rent_obligation_id = ro.id AND status = 'completed'), 0) >= ro.amount_due THEN 'paid'
             WHEN COALESCE((SELECT SUM(amount) FROM payments WHERE rent_obligation_id = ro.id AND status = 'completed'), 0) > 0
                 AND ro.due_date < CURRENT_DATE THEN 'overdue'
             WHEN COALESCE((SELECT SUM(amount) FROM payments WHERE rent_obligation_id = ro.id AND status = 'completed'), 0) > 0 THEN 'partial'
             WHEN ro.due_date < CURRENT_DATE THEN 'overdue'
             ELSE 'unpaid'
         END,
         updated_at = CURRENT_TIMESTAMP
         WHERE ro.id = $1
         RETURNING ro.id`,
        [obligationId]
    );
    return result.rowCount > 0;
};

const getObligationForLandlord = async (client, obligationId, landlordId, lock = false) => {
    const result = await client.query(
        `SELECT ro.id, ro.tenant_id, ro.amount_due, ro.due_date, ro.period_start,
                ro.period_end, ro.status, ro.notes
         FROM rent_obligations ro
         INNER JOIN tenants t ON t.id = ro.tenant_id
         INNER JOIN properties p ON p.id = t.property_id
         WHERE ro.id = $1 AND p.landlord_id = $2
         ${lock ? "FOR UPDATE OF ro" : ""}`,
        [obligationId, landlordId]
    );
    return result.rows[0] || null;
};

// Payment ledger endpoints
app.get("/api/payment-tenants", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });
    try {
        const result = await db.query(
            `SELECT t.id, t.full_name, t.property_id, p.property_name
             FROM tenants t 
             INNER JOIN properties p ON p.id = t.property_id
             WHERE p.landlord_id = $1 ORDER BY t.full_name ASC`,
            [claims.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching payment tenants:", error.message);
        res.status(500).json({ error: "Unable to load tenants." });
    }
});

app.get("/api/rent-obligations", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });

    const tenantId = req.query.tenantId;
    if (tenantId && !isValidId(tenantId)) return res.status(400).json({ error: "Invalid tenant ID." });

    try {
        const params = [claims.id];
        let query = obligationSelect;
        if (tenantId) {
            params.push(tenantId);
            query += ` AND ros.tenant_id = $${params.length}`;
        }
        query += " ORDER BY ros.due_date DESC, ros.id DESC";
        const result = await db.query(query, params);
        res.json(result.rows.map(serializeObligation));
    } catch (error) {
        console.error("Error fetching rent obligations:", error.message);
        res.status(500).json({ error: "Unable to load rent obligations." });
    }
});

app.post("/api/rent-obligations", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });

    const { tenant_id: tenantId, amount_due: amountDue, due_date: dueDate,
        period_start: periodStart, period_end: periodEnd, notes } = req.body;
    if (!isValidId(tenantId) || !isValidAmount(amountDue) || !isValidDate(dueDate) ||
        !isValidDate(periodStart) || !isValidDate(periodEnd)) {
        return res.status(400).json({ error: "Tenant, amount, and valid dates are required." });
    }
    if (periodEnd < periodStart) return res.status(400).json({ error: "Period end must be on or after period start." });
    if (notes !== undefined && notes !== null && typeof notes !== "string") {
        return res.status(400).json({ error: "Notes must be text." });
    }

    try {
        const ownership = await db.query(
            `SELECT t.id FROM tenants t
             INNER JOIN properties p ON p.id = t.property_id
             WHERE t.id = $1 AND p.landlord_id = $2`,
            [tenantId, claims.id]
        );
        if (ownership.rowCount === 0) return res.status(404).json({ error: "Tenant not found." });

        const result = await db.query(
            `INSERT INTO rent_obligations (tenant_id, amount_due, due_date, period_start, period_end, status, notes)
             VALUES ($1, $2::numeric, $3, $4, $5,
                 CASE WHEN $3::date < CURRENT_DATE THEN 'overdue' ELSE 'unpaid' END, $6)
             RETURNING id`,
            [tenantId, amountDue, dueDate, periodStart, periodEnd, notes?.trim() || null]
        );
        const obligation = await db.query(`${obligationSelect} AND ros.id = $2`, [claims.id, result.rows[0].id]);
        res.status(201).json(serializeObligation(obligation.rows[0]));
    } catch (error) {
        console.error("Error creating rent obligation:", error.message);
        res.status(500).json({ error: "Unable to create rent obligation." });
    }
});

app.get("/api/rent-obligations/:id", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid rent obligation ID." });

    try {
        const result = await db.query(`${obligationSelect} AND ros.id = $2`, [claims.id, req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: "Rent obligation not found." });
        res.json(serializeObligation(result.rows[0]));
    } catch (error) {
        console.error("Error fetching rent obligation:", error.message);
        res.status(500).json({ error: "Unable to load rent obligation." });
    }
});

app.get("/api/payments", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });
    const { tenantId, propertyId, status, paymentMethod, from, to, search } = req.query;
    if (tenantId && !isValidId(tenantId)) return res.status(400).json({ error: "Invalid tenant ID." });
    if (propertyId && !isValidId(propertyId)) return res.status(400).json({ error: "Invalid property ID." });
    if (from && !isValidDate(from) || to && !isValidDate(to)) return res.status(400).json({ error: "Invalid payment date range." });
    if (status && !["completed", "pending", "failed", "reversed"].includes(status)) return res.status(400).json({ error: "Invalid payment status." });
    if (paymentMethod && !paymentMethods.has(paymentMethod)) return res.status(400).json({ error: "Invalid payment method." });

    try {
        const params = [claims.id];
        let query = paymentSelect;
        const filters = [];
        const addFilter = (sql, value) => { params.push(value); filters.push(sql.replace("$value", `$${params.length}`)); };
        if (tenantId) addFilter("pay.tenant_id = $value", tenantId);
        if (propertyId) addFilter("p.id = $value", propertyId);
        if (status) addFilter("pay.status = $value", status);
        if (paymentMethod) addFilter("pay.payment_method = $value", paymentMethod);
        if (from) addFilter("pay.payment_date >= $value", from);
        if (to) addFilter("pay.payment_date <= $value", to);
        if (search) addFilter("t.full_name ILIKE $value", `%${String(search).trim()}%`);
        if (filters.length) query += ` AND ${filters.join(" AND ")}`;
        query += " ORDER BY pay.payment_date DESC, pay.id DESC";
        const result = await db.query(query, params);
        res.json(result.rows.map(serializePayment));
    } catch (error) {
        console.error("Error fetching payments:", error.message);
        res.status(500).json({ error: "Unable to load payments." });
    }
});

app.get("/api/payments/:id", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid payment ID." });
    try {
        const result = await db.query(`${paymentSelect} AND pay.id = $2`, [claims.id, req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: "Payment not found." });
        res.json(serializePayment(result.rows[0]));
    } catch (error) {
        console.error("Error fetching payment:", error.message);
        res.status(500).json({ error: "Unable to load payment." });
    }
});

app.get("/api/tenants/:tenantId/payments", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });
    if (!isValidId(req.params.tenantId)) return res.status(400).json({ error: "Invalid tenant ID." });
    try {
        const result = await db.query(`${paymentSelect} AND pay.tenant_id = $2 ORDER BY pay.payment_date DESC, pay.id DESC`, [claims.id, req.params.tenantId]);
        if (result.rowCount === 0) {
            const tenant = await db.query(`SELECT t.id FROM tenants t INNER JOIN properties p ON p.id = t.property_id WHERE t.id = $1 AND p.landlord_id = $2`, [req.params.tenantId, claims.id]);
            if (tenant.rowCount === 0) return res.status(404).json({ error: "Tenant not found." });
        }
        res.json(result.rows.map(serializePayment));
    } catch (error) {
        console.error("Error fetching tenant payments:", error.message);
        res.status(500).json({ error: "Unable to load tenant payments." });
    }
});

app.post("/api/payments", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });
    const { rent_obligation_id: obligationId, amount, payment_date: paymentDate,
        payment_method: paymentMethod, reference, notes } = req.body;
    if (!isValidId(obligationId) || !isValidAmount(amount) || !isValidDate(paymentDate) || !paymentMethods.has(paymentMethod)) {
        return res.status(400).json({ error: "Rent obligation, amount, payment date, and payment method are required." });
    }
    if (reference !== undefined && reference !== null && typeof reference !== "string") return res.status(400).json({ error: "Reference must be text." });
    if (notes !== undefined && notes !== null && typeof notes !== "string") return res.status(400).json({ error: "Notes must be text." });

    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const obligation = await getObligationForLandlord(client, obligationId, claims.id, true);
        if (!obligation) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Rent obligation not found." });
        }
        const balance = await client.query(
            `SELECT COALESCE(SUM(amount), 0)::numeric AS amount_paid,
                    ($1::numeric - COALESCE(SUM(amount), 0))::numeric AS outstanding
             FROM payments WHERE rent_obligation_id = $2 AND status = 'completed'`,
            [obligation.amount_due, obligation.id]
        );
        const outstanding = balance.rows[0].outstanding;
        const exceedsBalance = await client.query("SELECT $1::numeric > $2::numeric AS exceeds", [amount, outstanding]);
        if (exceedsBalance.rows[0].exceeds) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: `Payment exceeds the outstanding balance of ${outstanding}.` });
        }
        const inserted = await client.query(
            `INSERT INTO payments (rent_obligation_id, tenant_id, amount, payment_date, payment_method, reference, notes, status, recorded_by)
             VALUES ($1, $2, $3::numeric, $4, $5, $6, $7, 'completed', $8)
             RETURNING id`,
            [obligation.id, obligation.tenant_id, amount, paymentDate, paymentMethod, reference?.trim() || null, notes?.trim() || null, claims.id]
        );
        await refreshObligationStatus(client, obligation.id);
        await client.query("COMMIT");
        const payment = await db.query(`${paymentSelect} AND pay.id = $2`, [claims.id, inserted.rows[0].id]);
        const updatedObligation = await db.query(`${obligationSelect} AND ros.id = $2`, [claims.id, obligation.id]);
        res.status(201).json({ payment: serializePayment(payment.rows[0]), obligation: serializeObligation(updatedObligation.rows[0]) });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error recording payment:", error.message);
        res.status(500).json({ error: "Unable to record payment." });
    } finally {
        client.release();
    }
});

app.patch("/api/payments/:id", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid payment ID." });
    const allowed = ["payment_date", "payment_method", "reference", "notes"];
    const fields = Object.keys(req.body).filter((field) => allowed.includes(field));
    if (fields.length === 0 || fields.some((field) => field === "payment_date" && !isValidDate(req.body[field])) || fields.some((field) => field === "payment_method" && !paymentMethods.has(req.body[field]))) {
        return res.status(400).json({ error: "Only valid payment date, method, reference, or notes may be updated." });
    }
    if (["reference", "notes"].some((field) => field in req.body && req.body[field] !== null && typeof req.body[field] !== "string")) return res.status(400).json({ error: "Reference and notes must be text." });
    try {
        const values = [];
        const updates = fields.map((field) => {
            values.push(req.body[field] === "" ? null : req.body[field]);
            return `${field} = $${values.length}`;
        });
        values.push(req.params.id, claims.id);
        const result = await db.query(`UPDATE payments pay SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP FROM tenants t INNER JOIN properties p ON p.id = t.property_id WHERE pay.tenant_id = t.id AND pay.id = $${values.length - 1} AND p.landlord_id = $${values.length} RETURNING pay.id`, values);
        if (result.rowCount === 0) return res.status(404).json({ error: "Payment not found." });
        const payment = await db.query(`${paymentSelect} AND pay.id = $2`, [claims.id, req.params.id]);
        res.json(serializePayment(payment.rows[0]));
    } catch (error) {
        console.error("Error updating payment:", error.message);
        res.status(500).json({ error: "Unable to update payment." });
    }
});

app.patch("/api/payments/:id/reverse", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });
    if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid payment ID." });
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const payment = await client.query(
            `SELECT pay.id, pay.rent_obligation_id, pay.status
             FROM payments pay INNER JOIN tenants t ON t.id = pay.tenant_id
             INNER JOIN properties p ON p.id = t.property_id
             WHERE pay.id = $1 AND p.landlord_id = $2 FOR UPDATE`,
            [req.params.id, claims.id]
        );
        if (payment.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Payment not found." });
        }
        if (payment.rows[0].status === "reversed") {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Payment is already reversed." });
        }
        await client.query("UPDATE payments SET status = 'reversed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [req.params.id]);
        await refreshObligationStatus(client, payment.rows[0].rent_obligation_id);
        await client.query("COMMIT");
        const updated = await db.query(`${paymentSelect} AND pay.id = $2`, [claims.id, req.params.id]);
        const obligation = await db.query(`${obligationSelect} AND ros.id = $2`, [claims.id, payment.rows[0].rent_obligation_id]);
        res.json({ payment: serializePayment(updated.rows[0]), obligation: serializeObligation(obligation.rows[0]) });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error reversing payment:", error.message);
        res.status(500).json({ error: "Unable to reverse payment." });
    } finally {
        client.release();
    }
});

app.get("/api/dashboard/payment-summary", async (req, res) => {
    const claims = getAuthenticatedClaims(req);
    if (!claims) return res.status(401).json({ error: "Authentication required." });
    try {
        const summary = await db.query(
            `WITH ledger AS (
                SELECT ros.*, CASE WHEN ros.amount_paid >= ros.amount_due THEN 'paid'
                    WHEN ros.amount_paid > 0 AND ros.due_date < CURRENT_DATE THEN 'overdue'
                    WHEN ros.amount_paid > 0 THEN 'partial'
                    WHEN ros.due_date < CURRENT_DATE THEN 'overdue' ELSE 'unpaid' END AS calculated_status
                FROM rent_obligation_summary ros
                INNER JOIN tenants t ON t.id = ros.tenant_id
                INNER JOIN properties p ON p.id = t.property_id
                WHERE p.landlord_id = $1
            ) SELECT COALESCE(SUM(amount_due), 0)::numeric AS total_expected,
                     COALESCE(SUM(amount_paid), 0)::numeric AS total_collected,
                     COALESCE(SUM(amount_due - amount_paid), 0)::numeric AS total_outstanding,
                     COUNT(*) FILTER (WHERE calculated_status = 'paid')::int AS paid_count,
                     COUNT(*) FILTER (WHERE calculated_status = 'partial')::int AS partial_count,
                     COUNT(*) FILTER (WHERE calculated_status = 'overdue')::int AS overdue_count
              FROM ledger`,
            [claims.id]
        );
        const recent = await db.query(`${paymentSelect} AND pay.status = 'completed' ORDER BY pay.payment_date DESC, pay.id DESC LIMIT 5`, [claims.id]);
        const row = summary.rows[0];
        res.json({ totalExpected: row.total_expected, totalCollected: row.total_collected, totalOutstanding: row.total_outstanding, paidCount: row.paid_count, partialCount: row.partial_count, overdueCount: row.overdue_count, recentPayments: recent.rows.map(serializePayment) });
    } catch (error) {
        console.error("Error fetching payment summary:", error.message);
        res.status(500).json({ error: "Unable to load payment summary." });
    }
});

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

// search tenants by name or email
app.get("/api/tenants/search", async (req, res) => {
    const searchTerm = req.query.q?.trim();

    if (!searchTerm) {
        return res.status(400).json({ error: "A search term is required." });
    }

    try {
        const result = await db.query(
            `SELECT * FROM tenants
             WHERE full_name ILIKE $1 OR email ILIKE $1
             ORDER BY full_name ASC
             LIMIT 10`,
            [`%${searchTerm}%`]
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to search tenants." });
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

        // Validate tenant fields; documents are optional.
        if (!full_name || !email || !phone || !property || !room || !currency || !rent || !lease_start_date || !lease_end_date) {
            return res.status(400).json({ error: "All fields are required." });
        }

        if ((document_title && !documentUrl) || (!document_title && documentUrl)) {
            return res.status(400).json({ error: "Both document title and document file are required." });
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

        if (document_title && documentUrl) {
            await db.query(`INSERT INTO documents (document_title, document_url, tenant_id) VALUES ($1, $2, $3)`, [document_title, documentUrl, newTenant.id]);
        }

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

// Rent Reminder endpoint
app.post("/api/rent-reminders/run", async (req, res) => {
    try {
        const result = await processRentReminders();
        res.json(result);
    } catch (error) {
        console.error("Manual rent reminder run failed:", error.message);
        res.status(500).json({ error: "Failed to process rent reminders." });
    }
});

// Start the rent reminder scheduler when the server starts
startRentReminderScheduler();

// Server listener
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});