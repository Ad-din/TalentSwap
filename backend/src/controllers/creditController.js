const creditService = require('../services/creditService');

async function getMyBalance(req, res, next) {
  try {
    const balance = await creditService.getBalance(req.user._id);
    res.json({ balance });
  } catch (err) {
    next(err);
  }
}

async function getMyHistory(req, res, next) {
  try {
    const { limit, before } = req.query;
    const transactions = await creditService.getTransactionHistory(req.user._id, {
      limit: limit ? Number(limit) : undefined,
      before: before ? new Date(before) : undefined,
    });
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyBalance, getMyHistory };
