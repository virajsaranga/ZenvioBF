const User = require('../models/User.model');
const Transaction = require('../models/Transaction.model');
const { createNotification } = require('../utils/notification');

// @GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers, activeUsers, pendingKYC,
      totalTransactions, pendingDeposits, pendingWithdrawals,
      revenueData,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', status: 'active' }),
      User.countDocuments({ 'kyc.status': 'pending' }),
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
      Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalFees: { $sum: '$fee' }, totalVolume: { $sum: '$amount' } } },
      ]),
    ]);

    // Last 30 days transaction volume
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyVolume = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          volume: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, activeUsers, pendingKYC,
        totalTransactions, pendingDeposits, pendingWithdrawals,
        totalFees: revenueData[0]?.totalFees || 0,
        totalVolume: revenueData[0]?.totalVolume || 0,
      },
      dailyVolume,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role, kycStatus } = req.query;
    const query = {};
    if (role) query.role = role;
    else query.role = { $in: ['user', 'admin'] };
    if (status) query.status = status;
    if (kycStatus) query['kyc.status'] = kycStatus;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit),
      User.countDocuments(query),
    ]);

    res.json({ success: true, users, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const io = req.app.get('io');
    await createNotification(user._id, {
      tznve: `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: reason || `Your account has been ${status}.`,
      type: 'security',
    }, io);

    res.json({ success: true, message: `User ${status}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/kyc/:userId/review
exports.reviewKYC = async (req, res) => {
  try {
    const { decision, reason } = req.body; // 'approved' or 'rejected'
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.kyc.status = decision;
    user.kyc.reviewedAt = Date.now();
    user.kyc.reviewedBy = req.user._id;
    if (decision === 'rejected') user.kyc.rejectionReason = reason;
    if (decision === 'approved') {
      user.status = 'active';
      // Award trust points for KYC completion
      user.trustPoints += 20;
      user.trustPointsHistory.push({ amount: 20, type: 'earned', reason: 'KYC Approved' });
    }

    await user.save({ validateBeforeSave: false });

    const io = req.app.get('io');
    await createNotification(user._id, {
      tznve: `KYC ${decision === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
      message: decision === 'approved'
        ? 'Your identity has been verified! You can now access all features.'
        : `Your KYC was rejected: ${reason}. Please resubmit.`,
      type: 'kyc',
    }, io);

    res.json({ success: true, message: `KYC ${decision}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) query.transactionId = { $regex: search, $options: 'i' };

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('sender', 'firstName lastName email accountNumber')
        .populate('recipient', 'firstName lastName email accountNumber')
        .populate('processedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Transaction.countDocuments(query),
    ]);

    res.json({ success: true, transactions, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/admin/deposits/:id/approve  or /reject
exports.reviewDeposit = async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  try {
    const { decision, note } = req.body;
    const tx = await Transaction.findById(req.params.id).session(session);
    if (!tx || tx.type !== 'deposit') {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    tx.status = decision === 'approve' ? 'completed' : 'failed';
    tx.processedBy = req.user._id;
    tx.processedAt = Date.now();
    tx.adminNote = note;

    if (decision === 'approve') {
      const user = await User.findById(tx.recipient).session(session);
      user.balance += tx.amount;
      await user.save({ session, validateBeforeSave: false });
    }

    await tx.save({ session });
    await session.commitTransaction();

    const io = req.app.get('io');
    await createNotification(tx.recipient, {
      tznve: decision === 'approve' ? 'Deposit Approved! 💰' : 'Deposit Rejected',
      message: decision === 'approve'
        ? `$${tx.amount.toFixed(2)} has been added to your account.`
        : `Your deposit of $${tx.amount.toFixed(2)} was rejected. ${note || ''}`,
      type: 'transaction',
      data: { transactionId: tx.transactionId },
    }, io);

    res.json({ success: true, message: `Deposit ${decision === 'approve' ? 'approved' : 'rejected'}`, transaction: tx });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// @PUT /api/admin/withdrawals/:id/process
exports.processWithdrawal = async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  try {
    const { decision, note } = req.body;
    const tx = await Transaction.findById(req.params.id).session(session);
    if (!tx || tx.type !== 'withdrawal') {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (decision === 'approve') {
      tx.status = 'completed';
    } else {
      // Refund
      const user = await User.findById(tx.sender).session(session);
      user.balance += tx.amount + tx.fee;
      await user.save({ session, validateBeforeSave: false });
      tx.status = 'refunded';
    }

    tx.processedBy = req.user._id;
    tx.processedAt = Date.now();
    tx.adminNote = note;
    await tx.save({ session });
    await session.commitTransaction();

    const io = req.app.get('io');
    await createNotification(tx.sender, {
      tznve: decision === 'approve' ? 'Withdrawal Processed ✅' : 'Withdrawal Cancelled',
      message: decision === 'approve'
        ? `Your withdrawal of $${tx.amount.toFixed(2)} has been processed.`
        : `Your withdrawal was cancelled. $${(tx.amount + tx.fee).toFixed(2)} refunded.`,
      type: 'transaction',
    }, io);

    res.json({ success: true, transaction: tx });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};
