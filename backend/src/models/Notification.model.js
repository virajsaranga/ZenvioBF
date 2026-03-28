const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tznve:   { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['transaction', 'kyc', 'system', 'promotion', 'security', 'trust_points'],
    default: 'system',
  },
  isRead:  { type: Boolean, default: false },
  readAt:  Date,
  data:    { type: mongoose.Schema.Types.Mixed }, // extra payload (transaction id, etc.)
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
