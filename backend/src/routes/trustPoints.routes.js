// trustPoints.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/trustPoints.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', ctrl.getPoints);
router.post('/redeem', ctrl.redeemPoints);

module.exports = router;
