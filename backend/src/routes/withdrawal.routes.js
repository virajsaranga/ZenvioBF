const router = require('express').Router();
const { requestWithdrawal, getWithdrawals, cancelWithdrawal } = require('../controllers/withdrawal.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

router.use(protect);

router.post('/request', [
  body('amount').isFloat({ min: 5 }).withMessage('Minimum withdrawal is $5'),
  body('method').isIn(['bank_transfer', 'card', 'local_bank']),
  body('bankDetails.bankName').notEmpty(),
  body('bankDetails.accountNumber').notEmpty(),
  body('bankDetails.accountName').notEmpty(),
], validate, requestWithdrawal);

router.get('/', getWithdrawals);
router.delete('/:id/cancel', cancelWithdrawal);

module.exports = router;
