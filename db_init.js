const pool = require("./db");
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Drop existing tables if they exist
        await client.query(`
            DROP TABLE IF EXISTS transacoes;
            DROP TABLE IF EXISTS clientes;
        `);

        // Create tables
        await client.query(`
            CREATE TABLE clientes (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                limite INTEGER NOT NULL,
                saldo INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE transacoes (
                id SERIAL PRIMARY KEY,
                valor INTEGER NOT NULL,
                descricao TEXT NOT NULL,
                clienteId INTEGER NOT NULL,
                tipo CHAR(1) CHECK (tipo IN ('c', 'd')),
                createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (clienteId) REFERENCES clientes(id)
            );

            INSERT INTO clientes (nome, limite)
            VALUES
                ('o barato sai caro', 1000 * 100),
                ('zan corp ltda', 800 * 100),
                ('les cruders', 10000 * 100),
                ('padaria joia de cocaia', 100000 * 100),
                ('kid mais', 5000 * 100);
        `);
        console.log("Database initialization script executed successfully");
    } catch (err) {
        console.error("Error executing database initialization script:", err);
    } finally {
        client.release();
    }
}

module.exports = initializeDatabase;