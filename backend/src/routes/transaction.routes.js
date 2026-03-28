// ============================================================
// routes/transaction.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const { transfer, getTransactions, getTransaction, getSummary } = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

router.use(protect);

router.post('/transfer', [
  body('recipientAccountNumber').notEmpty(),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
], validate, transfer);

router.get('/', getTransactions);
router.get('/summary', getSummary);
router.get('/:id', getTransaction);

module.exports = router;
