const SwapRequest = require('../models/SwapRequest');
const Conversation = require('../models/Conversation');
const Skill = require('../models/Skill');
const { notify } = require('../services/notificationService');

async function createSwapRequest(req, res, next) {
  try {
    const { recipientId, offeredSkillId, requestedSkillId, message } = req.body;

    if (req.user.status !== 'active') {
      return res.status(403).json({ error: 'Suspended users cannot send swap requests.' });
    }
    if (String(recipientId) === String(req.user._id)) {
      return res.status(400).json({ error: 'You cannot send a swap request to yourself.' });
    }

    const [offeredSkill, requestedSkill] = await Promise.all([
      Skill.findById(offeredSkillId),
      Skill.findById(requestedSkillId),
    ]);
    if (!offeredSkill || !requestedSkill) {
      return res.status(404).json({ error: 'One or both skills were not found.' });
    }

    const existingPending = await SwapRequest.findOne({
      requester: req.user._id,
      recipient: recipientId,
      offeredSkill: offeredSkillId,
      requestedSkill: requestedSkillId,
      status: 'pending',
    });
    if (existingPending) {
      return res.status(409).json({ error: 'You already have a pending request for this exact swap.' });
    }

    const swapRequest = await SwapRequest.create({
      requester: req.user._id,
      recipient: recipientId,
      offeredSkill: offeredSkillId,
      requestedSkill: requestedSkillId,
      message: message || '',
    });
    await swapRequest.populate(['offeredSkill', 'requestedSkill', 'requester', 'recipient']);

    await notify({
      user: recipientId,
      type: 'swap_request',
      title: `${req.user.displayName} wants to swap skills with you`,
      message: `Offering ${offeredSkill.name} for ${requestedSkill.name}`,
      link: '/requests',
    });

    res.status(201).json({ swapRequest });
  } catch (err) {
    if (err.message?.includes('cannot send a swap request to themselves')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

async function listMySwapRequests(req, res, next) {
  try {
    const [sent, received] = await Promise.all([
      SwapRequest.find({ requester: req.user._id })
        .populate(['offeredSkill', 'requestedSkill', 'recipient'])
        .sort({ createdAt: -1 }),
      SwapRequest.find({ recipient: req.user._id })
        .populate(['offeredSkill', 'requestedSkill', 'requester'])
        .sort({ createdAt: -1 }),
    ]);
    res.json({ sent, received });
  } catch (err) {
    next(err);
  }
}

async function respondToSwapRequest(req, res, next) {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "accept" or "reject"' });
    }

    const swapRequest = await SwapRequest.findById(req.params.id).populate(['offeredSkill', 'requestedSkill']);
    if (!swapRequest) return res.status(404).json({ error: 'Swap request not found' });
    if (String(swapRequest.recipient) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the recipient can respond to this request.' });
    }
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ error: `This request is already ${swapRequest.status}.` });
    }

    swapRequest.status = action === 'accept' ? 'accepted' : 'rejected';
    swapRequest.respondedAt = new Date();
    await swapRequest.save();

    let conversation = null;
    if (action === 'accept') {
      conversation = await Conversation.create({
        participants: [swapRequest.requester, swapRequest.recipient],
        swapRequest: swapRequest._id,
      });
    }

    await notify({
      user: swapRequest.requester,
      type: 'swap_response',
      title: action === 'accept' ? 'Your swap request was accepted!' : 'Your swap request was declined',
      link: action === 'accept' ? '/messages' : '/requests',
    });

    res.json({ swapRequest, conversation });
  } catch (err) {
    next(err);
  }
}

async function cancelSwapRequest(req, res, next) {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id);
    if (!swapRequest) return res.status(404).json({ error: 'Swap request not found' });
    if (String(swapRequest.requester) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the requester can cancel this request.' });
    }
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel a request that is already ${swapRequest.status}.` });
    }

    swapRequest.status = 'cancelled';
    swapRequest.respondedAt = new Date();
    await swapRequest.save();

    res.json({ swapRequest });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSwapRequest, listMySwapRequests, respondToSwapRequest, cancelSwapRequest };
