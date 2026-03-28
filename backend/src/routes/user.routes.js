const router = require('express').Router();
const userCtrl = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

router.use(protect);

router.get('/profile', userCtrl.getProfile);
router.put('/profile', userCtrl.updateProfile);
router.post('/avatar', (req, res, next) => {
  userCtrl.avatarUpload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, userCtrl.uploadAvatar);
router.put('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], validate, userCtrl.changePassword);
router.get('/lookup/:accountNumber', userCtrl.lookupUser);
router.get('/referrals', userCtrl.getReferrals);

module.exports = router;
