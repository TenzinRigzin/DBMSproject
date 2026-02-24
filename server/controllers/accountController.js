const db = require('../config/db');

// GET /api/accounts — list all accounts
const getAccounts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM accounts ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        console.error('getAccounts error:', err);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
};

// GET /api/accounts/transactions/:id — get transactions for one account
const getTransactions = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT * FROM transactions WHERE account_id = ? ORDER BY transaction_date DESC',
            [id]
        );
        res.json(rows);
    } catch (err) {
        console.error('getTransactions error:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};

// POST /api/accounts/transaction — deposit or withdraw
const doTransaction = async (req, res) => {
    const { account_id, amount, type } = req.body;

    if (!account_id || !amount || !type) {
        return res.status(400).json({ error: 'account_id, amount, and type are required' });
    }

    if (!['DEPOSIT', 'WITHDRAW'].includes(type)) {
        return res.status(400).json({ error: 'type must be DEPOSIT or WITHDRAW' });
    }

    if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'amount must be positive' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Lock the account row
        const [rows] = await conn.query(
            'SELECT * FROM accounts WHERE id = ? FOR UPDATE',
            [account_id]
        );

        if (rows.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({ error: 'Account not found' });
        }

        const account = rows[0];
        const currentBalance = parseFloat(account.balance);
        const txAmount = parseFloat(amount);

        if (type === 'WITHDRAW' && currentBalance < txAmount) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const newBalance = type === 'DEPOSIT'
            ? currentBalance + txAmount
            : currentBalance - txAmount;

        await conn.query(
            'UPDATE accounts SET balance = ? WHERE id = ?',
            [newBalance, account_id]
        );

        await conn.query(
            'INSERT INTO transactions (account_id, amount, type, transaction_date) VALUES (?, ?, ?, NOW())',
            [account_id, txAmount, type]
        );

        await conn.commit();
        conn.release();

        res.json({ message: 'Transaction successful', newBalance });
    } catch (err) {
        await conn.rollback();
        conn.release();
        console.error('doTransaction error:', err);
        res.status(500).json({ error: 'Transaction failed' });
    }
};

module.exports = { getAccounts, getTransactions, doTransaction };
