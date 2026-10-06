const Notification = require('../models/Notification');

async function notify({ user, type, title, message = '', link = '' }) {
  return Notification.create({ user, type, title, message, link });
}

module.exports = { notify };
