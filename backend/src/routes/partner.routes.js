const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/User.model');

// @GET /api/partner/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('referrals', 'firstName lastName createdAt status');
    res.json({
      success: true,
      isPartner: user.isPartner,
      referralCode: user.referralCode,
      referralCount: user.referrals.length,
      referrals: user.referrals,
      commissionRate: user.partnerCommissionRate,
      trustPoints: user.trustPoints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/partner/apply
router.post('/apply', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isPartner) return res.status(400).json({ success: false, message: 'Already a partner' });
    if (user.kyc.status !== 'approved') return res.status(403).json({ success: false, message: 'KYC required for partner application' });

    // Auto-approve for now; admin review can be added
    user.isPartner = true;
    user.partnerCommissionRate = 5; // 5% default
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Partner application approved! You now earn 5% commission on referrals.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
