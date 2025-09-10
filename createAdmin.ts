import { hashPassword } from "./auth"; // Make sure this path matches your project
import { Pool } from "pg"; // PostgreSQL client

// ======= CONFIGURE THESE WITH YOUR RENDER DATABASE INFO =======
const DB_CONFIG = {
  user: "YOUR_DB_USERNAME",
  host: "YOUR_DB_HOST",
  database: "YOUR_DB_NAME",
  password: "YOUR_DB_PASSWORD",
  port: 5432,
};

const ADMIN_USERNAME = "faculty1";
const ADMIN_PASSWORD = "AdminPassword123"; // You can change this
const ADMIN_ROLE = "faculty"; // Only faculty can approve/cancel bookings
// =================================================================

async function createFacultyAdmin() {
  try {
    // 1️⃣ Connect to PostgreSQL
    const pool = new Pool(DB_CONFIG);
    const client = await pool.connect();

    // 2️⃣ Hash the password
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    // 3️⃣ Insert the user
    const query = `
      INSERT INTO users (username, password, role)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await client.query(query, [
      ADMIN_USERNAME,
      hashedPassword,
      ADMIN_ROLE,
    ]);

    console.log("Faculty/Admin user created successfully:");
    console.log(result.rows[0]);

    client.release();
    await pool.end();
  } catch (err) {
    console.error("Error creating admin:", err);
  }
}

createFacultyAdmin();
