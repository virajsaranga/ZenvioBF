const User = require('../models/User.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar_${req.user._id}${path.extname(file.originalname)}`);
  },
});
exports.avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 2 * 1024 * 1024 } }).single('avatar');

// @GET /api/users/profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).populate('referredBy', 'firstName lastName accountNumber');
  res.json({ success: true, user });
};

// @PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, preferredLanguage, notificationPrefs } = req.body;
    const updates = { firstName, lastName, phone, preferredLanguage, notificationPrefs };
    // Remove undefined
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @POST /api/users/avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });
    res.json({ success: true, avatar: avatarUrl, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/users/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/lookup/:accountNumber
exports.lookupUser = async (req, res) => {
  try {
    const user = await User.findOne({ accountNumber: req.params.accountNumber }).select('firstName lastName accountNumber avatar');
    if (!user) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/referrals
exports.getReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('referrals', 'firstName lastName accountNumber createdAt status');
    res.json({ success: true, referrals: user.referrals, referralCode: user.referralCode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
