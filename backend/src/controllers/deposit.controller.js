const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const { createNotification } = require('../utils/notification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for deposit proof upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/deposit-proofs';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `deposit_${req.user._id}_${Date.now()}${ext}`);
  },
});
exports.upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880) },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images and PDFs allowed'));
  },
}).single('proof');

// @POST /api/deposits/request
exports.requestDeposit = async (req, res) => {
  try {
    const { amount, method, note } = req.body;
    const proofUrl = req.file ? `/uploads/deposit-proofs/${req.file.filename}` : null;

    if (method !== 'card' && !proofUrl) {
      return res.status(400).json({ success: false, message: 'Payment proof required for this method' });
    }

    const deposit = await Transaction.create({
      type: 'deposit',
      recipient: req.user._id,
      amount: parseFloat(amount),
      fee: 0,
      netAmount: parseFloat(amount),
      currency: 'USD',
      status: 'pending',
      depositMethod: method,
      depositProof: proofUrl,
      note,
      ipAddress: req.ip,
    });

    // Notify admins
    const io = req.app.get('io');
    await createNotification(req.user._id, {
      tznve: 'Deposit Request Submitted',
      message: `Your deposit of $${amount} is under review. We'll notify you once approved.`,
      type: 'transaction',
      data: { transactionId: deposit.transactionId },
    }, io);

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted. Pending admin approval.',
      deposit,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/deposits
exports.getDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { recipient: req.user._id, type: 'deposit' };
    if (status) query.status = status;

    const [deposits, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit),
      Transaction.countDocuments(query),
    ]);

    res.json({ success: true, deposits, pagination: { page: +page, limit: +limit, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
