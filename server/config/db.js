import pg from "pg";
import env from "dotenv";

env.config();

const { Pool } = pg;

// Prevent backend date timezone shifts
pg.types.setTypeParser(1082, (value) => value);

// Create a new PostgreSQL connection pool using environment variables
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Disable SSL certificate verification (use with caution)
    },
});

db.connect()
    .then(() => console.log("Connected to PostgreSQL database"))
    .catch((error) => console.error("Database connection error:", error.stack));

export default db;
