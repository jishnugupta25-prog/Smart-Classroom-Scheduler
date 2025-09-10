import { hashPassword } from "./auth"; 
import { Pool } from "pg"; 
const DB_CONFIG = {
  user: "YOUR_DB_USERNAME",
  host: "YOUR_DB_HOST",
  database: "YOUR_DB_NAME",
  password: "YOUR_DB_PASSWORD",
  port: 5432,
};

const ADMIN_USERNAME = "faculty1";
const ADMIN_PASSWORD = "AdminPassword123"; 
const ADMIN_ROLE = "faculty";

async function createFacultyAdmin() {
  try {
    const pool = new Pool(DB_CONFIG);
    const client = await pool.connect();

    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
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
