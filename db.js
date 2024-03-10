const { Pool } = require("pg");

const pool = new Pool({
  user: "admin",
  password: "123",
  host: "db",
  port: 5432,
  database: "rinha"
});

pool.connect()
  .then(() => {
    console.log("Connected to PostgreSQL database!");
    // Additional initialization or queries can go here
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });

module.exports = pool;
