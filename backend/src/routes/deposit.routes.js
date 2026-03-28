const router = require('express').Router();
const { requestDeposit, getDeposits, upload } = require('../controllers/deposit.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/request', (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, requestDeposit);
router.get('/', getDeposits);

module.exports = router;
