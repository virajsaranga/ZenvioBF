const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const { createNotification } = require('../utils/notification');

// @POST /api/withdrawals/request
exports.requestWithdrawal = async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  try {
    const { amount, method, bankDetails, note } = req.body;
    const user = await User.findById(req.user._id).session(session);

    if (user.kyc.status !== 'approved') {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'KYC verification required for withdrawals' });
    }

    const fee = Math.max((amount * parseFloat(process.env.DEFAULT_TRANSFER_FEE_PERCENT || 1.5)) / 100, 0.5);
    const totalDeduct = parseFloat(amount) + fee;

    if (user.balance < totalDeduct) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required: $${totalDeduct.toFixed(2)}, Available: $${user.balance.toFixed(2)}`,
      });
    }

    // Hold funds immediately
    user.balance -= totalDeduct;
    await user.save({ session, validateBeforeSave: false });

    const withdrawal = await Transaction.create([{
      type: 'withdrawal',
      sender: user._id,
      amount: parseFloat(amount),
      fee,
      netAmount: parseFloat(amount),
      currency: user.currency,
      status: 'pending',
      withdrawalMethod: method,
      bankDetails,
      note,
      senderBalanceBefore: user.balance + totalDeduct,
      senderBalanceAfter: user.balance,
      ipAddress: req.ip,
    }], { session });

    await session.commitTransaction();

    const io = req.app.get('io');
    await createNotification(user._id, {
      tznve: 'Withdrawal Request Submitted',
      message: `Withdrawal of $${amount} is pending. Funds are on hold pending admin approval.`,
      type: 'transaction',
      data: { transactionId: withdrawal[0].transactionId },
    }, io);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted. Pending admin approval.',
      withdrawal: withdrawal[0],
      fee,
      newBalance: user.balance,
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// @GET /api/withdrawals
exports.getWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { sender: req.user._id, type: 'withdrawal' };
    if (status) query.status = status;

    const [withdrawals, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit),
      Transaction.countDocuments(query),
    ]);

    res.json({ success: true, withdrawals, pagination: { page: +page, limit: +limit, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/withdrawals/:id/cancel
exports.cancelWithdrawal = async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({
      _id: req.params.id,
      sender: req.user._id,
      type: 'withdrawal',
      status: 'pending',
    }).session(session);

    if (!tx) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Pending withdrawal not found' });
    }

    // Refund
    const user = await User.findById(req.user._id).session(session);
    user.balance += tx.amount + tx.fee;
    await user.save({ session, validateBeforeSave: false });

    tx.status = 'cancelled';
    await tx.save({ session });
    await session.commitTransaction();

    res.json({ success: true, message: 'Withdrawal cancelled and funds refunded', newBalance: user.balance });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};
