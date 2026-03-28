const router = require('express').Router();
const adminCtrl = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin', 'superadmin'));

router.get('/dashboard', adminCtrl.getDashboard);
router.get('/users', adminCtrl.getUsers);
router.put('/users/:id/status', adminCtrl.updateUserStatus);
router.put('/kyc/:userId/review', adminCtrl.reviewKYC);
router.get('/transactions', adminCtrl.getAllTransactions);
router.put('/deposits/:id/review', adminCtrl.reviewDeposit);
router.put('/withdrawals/:id/process', adminCtrl.processWithdrawal);

module.exports = router;
