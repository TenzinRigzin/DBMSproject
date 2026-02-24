const express = require('express');
const cors = require('cors');
require('dotenv').config();

const accountRoutes = require('./routes/accountRoutes');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: 'http://localhost:3000', // React dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/accounts', accountRoutes);

// Health check
app.get('/', (req, res) => res.json({ status: 'BMS backend is running ✅' }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅  BMS backend listening on http://localhost:${PORT}`);
});
