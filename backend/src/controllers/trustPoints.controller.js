// ===== Trust Points Controller =====
const User = require('../models/User.model');
const Transaction = require('../models/Transaction.model');

exports.getPoints = async (req, res) => {
  const user = await User.findById(req.user._id).select('trustPoints trustPointsHistory');
  res.json({ success: true, trustPoints: user.trustPoints, history: user.trustPointsHistory });
};

exports.redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    const cashRate = parseFloat(process.env.TRUST_POINTS_TO_CASH_RATE || 0.01);
    const user = await User.findById(req.user._id);

    if (user.trustPoints < points) {
      return res.status(400).json({ success: false, message: 'Insufficient trust points' });
    }
    if (points < 100) {
      return res.status(400).json({ success: false, message: 'Minimum redemption is 100 points' });
    }

    const cashValue = points * cashRate;
    user.trustPoints -= points;
    user.balance += cashValue;
    user.trustPointsHistory.push({ amount: points, type: 'redeemed', reason: `Redeemed for $${cashValue.toFixed(2)}` });
    await user.save({ validateBeforeSave: false });

    await Transaction.create({
      type: 'trust_points_redeem',
      recipient: user._id,
      amount: cashValue,
      fee: 0,
      netAmount: cashValue,
      status: 'completed',
      description: `Trust Points Redemption: ${points} points`,
    });

    res.json({ success: true, message: `${points} points redeemed for $${cashValue.toFixed(2)}`, newBalance: user.balance, remainingPoints: user.trustPoints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
