const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true },

  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'fee', 'trust_points_redeem', 'partner_commission'],
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
  },

  // Parties
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Amounts
  amount:        { type: Number, required: true, min: 0 },
  fee:           { type: Number, default: 0 },
  netAmount:     { type: Number }, // amount - fee
  currency:      { type: String, default: 'USD' },

  // Transfer details
  description: String,
  reference:   String,
  note:        String,

  // Deposit specific
  depositMethod: {
    type: String,
    enum: ['bank_transfer', 'card', 'local_bank', 'crypto'],
  },
  depositProof: String, // file URL

  // Withdrawal specific
  withdrawalMethod: {
    type: String,
    enum: ['bank_transfer', 'card', 'local_bank'],
  },
  bankDetails: {
    bankName:      String,
    accountNumber: String,
    accountName:   String,
    branchCode:    String,
    swiftCode:     String,
    iban:          String,
    country:       String,
  },

  // Trust points awarded
  trustPointsAwarded: { type: Number, default: 0 },

  // Admin
  processedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt:  Date,
  adminNote:    String,
  failureReason: String,

  // Metadata
  ipAddress: String,
  userAgent: String,

  // Balance snapshots
  senderBalanceBefore:    Number,
  senderBalanceAfter:     Number,
  recipientBalanceBefore: Number,
  recipientBalanceAfter:  Number,
}, { timestamps: true });

// Auto-generate transaction ID
transactionSchema.pre('save', function (next) {
  if (!this.transactionId) {
    const prefix = this.type === 'deposit' ? 'ZDP' :
                   this.type === 'withdrawal' ? 'ZWD' :
                   this.type.startsWith('transfer') ? 'ZTF' : 'ZTX';
    this.transactionId = `${prefix}${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }
  if (!this.netAmount) {
    this.netAmount = this.amount - (this.fee || 0);
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
