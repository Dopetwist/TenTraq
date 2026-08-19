import express from "express";
import env from "dotenv";
import cors from "cors";
import pkg from "pg";
import pg from "pg";

const { Pool } = pkg;

env.config();

const app = express();
const port = process.env.PORT || 5000;

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
        const { 
            full_name, 
            email, 
            phone,
            property,
            room,
            currency,
            rent,
            move_in,
            lease_end
        } = req.body;

        const result = await db.query(
            `INSERT INTO tenants 
                (full_name, email, phone, property_id, room_number, rent_amount, lease_start_date, lease_end_date, currency)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [full_name, email, phone, property, room, rent, move_in, lease_end, currency]
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
        move_in,
        lease_end
    } = req.body;

    try {
        await db.query(`UPDATE tenant_app.tenants SET 
            full_name = $1, email = $2, phone = $3, property_id = $4, room_number = $5, 
            rent_amount = $6, move_in_date = $7, lease_end = $8, currency = $9
            WHERE tenant_app.tenants.id = $10
            `, [full_name, email, phone, property, room, rent, move_in, lease_end, currency, id]);

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
        const result = await db.query("DELETE FROM tenant_app.tenants WHERE tenant_app.tenants.id = $1", [id]);

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
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// add properties
app.post("/api/properties", async (req, res) => {
    try {
        const { property_name, address } = req.body;

        const result = await db.query(
            "INSERT INTO properties (property_name, property_address) VALUES ($1, $2) RETURNING *",
            [property_name, address]
        );

        res.status(201).json(result.rows[0]);
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
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});