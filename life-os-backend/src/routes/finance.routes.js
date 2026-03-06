const express = require('express');
const router = express.Router();
const {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getSummary,
    getCategories,
    createCategory,
    deleteCategory,
    upsertBudget,
} = require('../controllers/finance.controller');

// Summary (dashboard data)
router.get('/summary', getSummary);

// Transactions
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

// Budgets
router.post('/budgets', upsertBudget);

module.exports = router;
