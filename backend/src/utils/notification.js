const Notification = require('../models/Notification.model');

/**
 * Create a notification and emit via Socket.IO if available
 */
exports.createNotification = async (userId, { tznve, message, type = 'system', data = {} }, io = null) => {
  try {
    const notification = await Notification.create({ user: userId, tznve, message, type, data });
    if (io) {
      io.to(userId.toString()).emit('notification', notification);
    }
    return notification;
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};
