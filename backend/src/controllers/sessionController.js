const Session = require('../models/Session');
const SwapRequest = require('../models/SwapRequest');
const creditService = require('../services/creditService');
const { notify } = require('../services/notificationService');

/**
 * Checks whether a candidate [startTime, endTime] window overlaps any
 * existing scheduled/in_progress session for the given user (as either
 * teacher or learner). Used to enforce "no overlapping SkillSwap sessions"
 * per spec section 8.
 */
async function hasConflict(userId, startTime, endTime, excludeSessionId = null) {
  const query = {
    status: { $in: ['scheduled', 'in_progress'] },
    $or: [{ teacher: userId }, { learner: userId }],
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeSessionId) query._id = { $ne: excludeSessionId };
  const conflict = await Session.findOne(query);
  return Boolean(conflict);
}

async function createSession(req, res, next) {
  try {
    const { swapRequestId, skillId, startTime, endTime, isOnline, meetingLink, address } = req.body;

    const swapRequest = await SwapRequest.findById(swapRequestId);
    if (!swapRequest) return res.status(404).json({ error: 'Swap request not found' });
    if (swapRequest.status !== 'accepted') {
      return res.status(400).json({ error: 'Sessions can only be scheduled for accepted swap requests.' });
    }

    const isParticipant =
      String(swapRequest.requester) === String(req.user._id) ||
      String(swapRequest.recipient) === String(req.user._id);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Only participants in this swap can schedule a session.' });
    }

    let teacher;
    let learner;
    if (String(skillId) === String(swapRequest.offeredSkill)) {
      teacher = swapRequest.requester;
      learner = swapRequest.recipient;
    } else if (String(skillId) === String(swapRequest.requestedSkill)) {
      teacher = swapRequest.recipient;
      learner = swapRequest.requester;
    } else {
      return res.status(400).json({ error: 'skillId must be one of the two skills in this swap.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!(start < end)) {
      return res.status(400).json({ error: 'startTime must be before endTime.' });
    }

    const [teacherConflict, learnerConflict] = await Promise.all([
      hasConflict(teacher, start, end),
      hasConflict(learner, start, end),
    ]);
    if (teacherConflict || learnerConflict) {
      return res.status(409).json({ error: 'This time overlaps an existing session for one of the participants.' });
    }

    const session = await Session.create({
      swapRequest: swapRequest._id,
      teacher,
      learner,
      skill: skillId,
      startTime: start,
      endTime: end,
      location: { isOnline: isOnline !== false, meetingLink: meetingLink || '', address: address || '' },
    });
    await session.populate(['teacher', 'learner', 'skill']);

    const otherParticipant = String(teacher) === String(req.user._id) ? learner : teacher;
    await notify({
      user: otherParticipant,
      type: 'session_scheduled',
      title: 'A session was scheduled',
      link: '/sessions',
    });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
}

async function listMySessions(req, res, next) {
  try {
    const sessions = await Session.find({
      $or: [{ teacher: req.user._id }, { learner: req.user._id }],
    })
      .populate(['teacher', 'learner', 'skill'])
      .sort({ startTime: -1 });
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

function assertParticipant(session, userId) {
  return String(session.teacher._id || session.teacher) === String(userId) ||
    String(session.learner._id || session.learner) === String(userId);
}

async function cancelSession(req, res, next) {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!assertParticipant(session, req.user._id)) {
      return res.status(403).json({ error: 'Only participants can modify this session.' });
    }
    if (!['scheduled', 'in_progress'].includes(session.status)) {
      return res.status(400).json({ error: `Cannot cancel a session that is already ${session.status}.` });
    }

    session.status = 'cancelled';
    session.cancelledBy = req.user._id;
    session.cancellationReason = req.body.reason || '';
    await session.save();

    const other = String(session.teacher) === String(req.user._id) ? session.learner : session.teacher;
    await notify({ user: other, type: 'session_cancelled', title: 'A session was cancelled', link: '/sessions' });

    res.json({ session });
  } catch (err) {
    next(err);
  }
}

/**
 * Either participant can mark a session completed. This is what triggers
 * the credit transfer (teacher earns, learner spends) - guarded by
 * creditsSettled so it can never double-fire.
 */
async function completeSession(req, res, next) {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!assertParticipant(session, req.user._id)) {
      return res.status(403).json({ error: 'Only participants can modify this session.' });
    }
    if (!['scheduled', 'in_progress'].includes(session.status)) {
      return res.status(400).json({ error: `Cannot complete a session that is already ${session.status}.` });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    if (!session.creditsSettled) {
      try {
        await creditService.settleSessionCredits(session);
        session.creditsSettled = true;
        await session.save();
      } catch (creditErr) {
        // Session is still marked completed - the learner just couldn't
        // afford it (shouldn't normally happen since bookings are gated on
        // balance, but credits could have been spent elsewhere meanwhile).
        // Surface this rather than silently losing the mismatch.
        return res.status(402).json({
          error: `Session marked completed, but credit transfer failed: ${creditErr.message}`,
          session,
        });
      }
    }

    const other = String(session.teacher) === String(req.user._id) ? session.learner : session.teacher;
    await notify({ user: other, type: 'session_scheduled', title: 'A session was marked completed', link: '/sessions' });

    res.json({ session });
  } catch (err) {
    next(err);
  }
}

async function reportNoShow(req, res, next) {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!assertParticipant(session, req.user._id)) {
      return res.status(403).json({ error: 'Only participants can report this session.' });
    }
    if (session.noShowReport) {
      return res.status(409).json({ error: 'A no-show has already been reported for this session.' });
    }

    session.status = 'no_show';
    session.noShowReport = {
      reportedBy: req.user._id,
      reason: req.body.reason || '',
    };
    await session.save();

    const other = String(session.teacher) === String(req.user._id) ? session.learner : session.teacher;
    await notify({
      user: other,
      type: 'no_show_report',
      title: 'A no-show was reported for your session',
      link: '/sessions',
    });

    res.json({ session });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSession, listMySessions, cancelSession, completeSession, reportNoShow, hasConflict };
