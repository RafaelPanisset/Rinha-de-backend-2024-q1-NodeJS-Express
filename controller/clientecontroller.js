const pool = require("../db");
//https://blog.devgenius.io/create-a-crud-api-using-node-js-express-and-postgresql-51041cb16e46


exports.transacao = async (req, res) => {
    const { id } = req.params;
    const { valor, tipo, descricao } = req.body;

    // Validar ID do cliente
    if (id === null || id === undefined || !Number.isInteger(parseInt(id))) {
        return res.status(400).send('ID inválido');
    }

    // Validar valor
    if (valor === null || valor === undefined || !Number.isInteger(valor) || valor <= 0) {
        return res.status(422).send('Valor inválido');
    }

    // Validar tipo
    if (tipo === null || tipo === undefined || (tipo !== 'c' && tipo !== 'd')) {
        return res.status(422).send('Tipo inválido');
    }

    // Validar descrição
    if (descricao === null || descricao === undefined || descricao.length < 1 || descricao.length > 10) {
        return res.status(422).send('Descrição inválida');
    }

    // Cliente não encontrado
    const clienteQuery = `SELECT * FROM clientes WHERE id = $1`;
    const clienteResult = await pool.query(clienteQuery, [id]).catch(err => {
        console.error('Error executing query:', err);
        return res.status(500).send('Erro interno do servidor');
    });
    if (clienteResult.rows.length === 0) {
        return res.status(404).send('Cliente não encontrado');
    }
    const cliente = clienteResult.rows[0];

    // Transação de débito e saldo negativo
    if (tipo === 'd' && (cliente.saldo - valor < -cliente.limite || cliente.saldo - valor < 0)) {
        return res.status(422).send('Saldo insuficiente');
    }

    // Inserir nova transação na tabela 'transacoes'
    const insertQuery = `INSERT INTO transacoes (valor, tipo, descricao, clienteId)
                            VALUES ($1, $2, $3, $4)`;

    await pool.query(insertQuery, [valor, tipo, descricao, id]).catch(err => {
        console.error('Error executing insertion query:', err);
        return res.status(500).send('Erro ao inserir transação');
    });


    if (tipo === 'c') {
        cliente.saldo += valor;
    } else {
        cliente.saldo -= valor;
    }
    const updateQuery = `UPDATE clientes SET saldo = $1 WHERE id = $2`;
    await pool.query(updateQuery, [cliente.saldo, id]).catch(err => {
        console.error('Error updating saldo:', err);
        return res.status(500).send('Erro ao atualizar saldo do cliente');
    });
    
    // Retornar resposta
    res.status(200).send({
        limite: cliente.limite,
        saldo: cliente.saldo + (tipo === 'c' ? valor : -valor),
    });
};

exports.extrato = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar se o cliente existe
        const clienteQuery = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
        const cliente = clienteQuery.rows[0];
        if (!cliente) {
            return res.status(404).send('Cliente não encontrado');
        }

        // Buscar saldo total atual do cliente
        const saldoQuery = await pool.query('SELECT SUM(valor) AS total FROM transacoes WHERE clienteId = $1', [cliente.id]);
        const saldoTotal = saldoQuery.rows[0].total || 0;

        // Buscar até as 10 últimas transações
        const ultimasTransacoesQuery = await pool.query('SELECT * FROM transacoes WHERE clienteid = $1 ORDER BY createdat DESC LIMIT 10', [cliente.id]);
        const ultimasTransacoes = ultimasTransacoesQuery.rows;

        // Montar resposta
        const resposta = {
            saldo: {
                total: saldoTotal,
                data_extrato: new Date(),
                limite: cliente.limite
            },
            ultimas_transacoes: ultimasTransacoes.map(transacao => ({
                valor: transacao.valor,
                tipo: transacao.tipo,
                descricao: transacao.descricao,
                realizada_em: transacao.createdat
            }))
        };

        res.status(200).json(resposta);
    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        res.status(500).send('Erro interno ao processar a requisição');
    }
};


