const express = require('express');
const router = express.Router();
const { getAccounts, getTransactions, doTransaction } = require('../controllers/accountController');

router.get('/', getAccounts);
router.get('/transactions/:id', getTransactions);
router.post('/transaction', doTransaction);

module.exports = router;
