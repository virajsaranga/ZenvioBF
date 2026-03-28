const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const { createNotification } = require('../utils/notification');

// Calculate fee
function calculateFee(amount) {
  const feePercent = parseFloat(process.env.DEFAULT_TRANSFER_FEE_PERCENT || 1.5);
  const minFee = parseFloat(process.env.MIN_TRANSFER_FEE || 0.50);
  return Math.max((amount * feePercent) / 100, minFee);
}

// @POST /api/transactions/transfer
exports.transfer = async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();

  try {
    const { recipientAccountNumber, amount, description, note } = req.body;
    const sender = await User.findById(req.user._id).session(session);

    if (sender.kyc.status !== 'approved') {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'KYC verification required for transfers' });
    }

    const recipient = await User.findOne({ accountNumber: recipientAccountNumber }).session(session);
    if (!recipient) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Recipient account not found' });
    }

    if (sender._id.toString() === recipient._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cannot transfer to yourself' });
    }

    const fee = calculateFee(amount);
    const totalDeduct = amount + fee;

    if (sender.balance < totalDeduct) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required: ${totalDeduct.toFixed(2)}, Available: ${sender.balance.toFixed(2)}`,
      });
    }

    const senderBalBefore = sender.balance;
    const recipientBalBefore = recipient.balance;

    // Deduct from sender
    sender.balance -= totalDeduct;
    // Credit recipient
    recipient.balance += amount;

    // Award trust points to sender
    const pointsEarned = parseInt(process.env.TRUST_POINTS_PER_TRANSFER || 10);
    sender.trustPoints += pointsEarned;
    sender.trustPointsHistory.push({ amount: pointsEarned, type: 'earned', reason: `Transfer to ${recipient.accountNumber}` });

    await sender.save({ session, validateBeforeSave: false });
    await recipient.save({ session, validateBeforeSave: false });

    // Create transaction records
    const txOut = await Transaction.create([{
      type: 'transfer_out',
      sender: sender._id,
      recipient: recipient._id,
      amount,
      fee,
      netAmount: amount,
      currency: sender.currency,
      description,
      note,
      status: 'completed',
      senderBalanceBefore: senderBalBefore,
      senderBalanceAfter: sender.balance,
      recipientBalanceBefore: recipientBalBefore,
      recipientBalanceAfter: recipient.balance,
      trustPointsAwarded: pointsEarned,
      ipAddress: req.ip,
    }], { session });

    const txIn = await Transaction.create([{
      type: 'transfer_in',
      sender: sender._id,
      recipient: recipient._id,
      amount,
      fee: 0,
      netAmount: amount,
      currency: recipient.currency,
      description,
      note,
      status: 'completed',
      recipientBalanceBefore: recipientBalBefore,
      recipientBalanceAfter: recipient.balance,
      reference: txOut[0].transactionId,
    }], { session });

    await session.commitTransaction();

    // Send real-time notifications
    const io = req.app.get('io');
    await createNotification(sender._id, {
      tznve: 'Transfer Sent',
      message: `$${amount.toFixed(2)} sent to ${recipient.firstName} ${recipient.lastName}. Fee: $${fee.toFixed(2)}`,
      type: 'transaction',
      data: { transactionId: txOut[0].transactionId },
    }, io);

    await createNotification(recipient._id, {
      tznve: 'Money Received!',
      message: `$${amount.toFixed(2)} received from ${sender.firstName} ${sender.lastName}`,
      type: 'transaction',
      data: { transactionId: txIn[0].transactionId },
    }, io);

    res.json({
      success: true,
      message: 'Transfer successful',
      transaction: txOut[0],
      fee,
      trustPointsEarned: pointsEarned,
      newBalance: sender.balance,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// @GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;
    const query = {
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    };
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('sender', 'firstName lastName accountNumber avatar')
        .populate('recipient', 'firstName lastName accountNumber avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/transactions/:id
exports.getTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      transactionId: req.params.id,
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    })
      .populate('sender', 'firstName lastName accountNumber')
      .populate('recipient', 'firstName lastName accountNumber');

    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/transactions/summary
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSent, totalReceived, monthSent, monthReceived] = await Promise.all([
      Transaction.aggregate([
        { $match: { sender: userId, type: 'transfer_out', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { recipient: userId, type: 'transfer_in', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { sender: userId, type: 'transfer_out', status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { recipient: userId, type: 'transfer_in', status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      summary: {
        totalSent: totalSent[0]?.total || 0,
        totalSentCount: totalSent[0]?.count || 0,
        totalReceived: totalReceived[0]?.total || 0,
        totalReceivedCount: totalReceived[0]?.count || 0,
        monthSent: monthSent[0]?.total || 0,
        monthReceived: monthReceived[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
