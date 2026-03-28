const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, required: true, unique: true },
  password:  { type: String, required: true, minlength: 8, select: false },

  // Account
  accountNumber: { type: String, unique: true },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending'], default: 'pending' },

  // Balance
  balance: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'USD' },

  // KYC
  kyc: {
    status: { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
    documents: [{
      type: { type: String, enum: ['national_id', 'passport', 'driving_license', 'proof_of_address'] },
      fileUrl: String,
      fileName: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    personalInfo: {
      dateOfBirth: Date,
      nationality: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },
  },

  // Trust Points
  trustPoints: { type: Number, default: 0 },
  trustPointsHistory: [{
    amount: Number,
    type: { type: String, enum: ['earned', 'redeemed'] },
    reason: String,
    date: { type: Date, default: Date.now },
  }],

  // Referral / Partner
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPartner: { type: Boolean, default: false },
  partnerCommissionRate: { type: Number, default: 0 },

  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, select: false },
  emailVerifyExpires: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  refreshToken: { type: String, select: false },

  // Activity
  lastLogin: Date,
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
  }],

  // Profile
  avatar: String,
  preferredLanguage: { type: String, default: 'en' },

  // Notifications preferences
  notificationPrefs: {
    email: { type: Boolean, default: true },
    sms:   { type: Boolean, default: true },
    push:  { type: Boolean, default: true },
  },
}, { timestamps: true });

// Generate account number before save
userSchema.pre('save', async function (next) {
  // Hash password
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Generate account number
  if (!this.accountNumber) {
    this.accountNumber = 'ZNV' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  }

  // Generate referral code
  if (!this.referralCode) {
    const { nanoid } = await import('nanoid');
    this.referralCode = (await import('nanoid')).customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)();
  }

  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
