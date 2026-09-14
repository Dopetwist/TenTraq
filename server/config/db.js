import pg from "pg";
import env from "dotenv";

env.config();

const { Pool } = pg;

// Prevent backend date timezone shifts
pg.types.setTypeParser(1082, (value) => value);

// Create a new PostgreSQL connection pool using environment variables
const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432),
});

db.connect()
    .then(() => console.log("Connected to PostgreSQL database"))
    .catch((error) => console.error("Database connection error:", error.stack));

export default db;
