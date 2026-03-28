// ===== kyc.routes.js =====
const kycRouter = require('express').Router();
const kycCtrl = require('../controllers/kyc.controller');
const { protect } = require('../middleware/auth.middleware');

kycRouter.use(protect);
kycRouter.post('/submit', (req, res, next) => {
  kycCtrl.upload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, kycCtrl.submitKYC);
kycRouter.get('/status', kycCtrl.getKYCStatus);

module.exports = kycRouter;
