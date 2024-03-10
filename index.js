const express = require("express");
const app = express();
const clienteController = require("./controller/clientecontroller");
const initializeDatabase = require("./db_init");

// Middleware
app.use(express.json());

// Routes
app.post("/clientes/:id/transacoes", clienteController.transacao);
app.get("/clientes/:id/extrato", clienteController.extrato);


initializeDatabase().then(() => {
    // Start the server after executing the script
    app.listen(8080, () => {
        console.log("Server is running");
    });
});
