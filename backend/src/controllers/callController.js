import Call from '../models/Call.js';

// @desc    Get user's call history
// @route   GET /api/calls
export const getCalls = async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [{ caller: req.user._id }, { receiver: req.user._id }],
    })
      .populate('caller', 'name username email avatar phoneNumber isOnline')
      .populate('receiver', 'name username email avatar phoneNumber isOnline')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or update a call log
// @route   POST /api/calls
export const logCall = async (req, res) => {
  try {
    const { receiverId, callType, status, duration, startTime, endTime, callId } = req.body;

    if (callId) {
      const existingCall = await Call.findById(callId);
      if (existingCall) {
        if (status) existingCall.status = status;
        if (duration !== undefined) existingCall.duration = duration;
        if (endTime) existingCall.endTime = endTime;
        await existingCall.save();

        const populated = await Call.findById(existingCall._id)
          .populate('caller', 'name username email avatar phoneNumber isOnline')
          .populate('receiver', 'name username email avatar phoneNumber isOnline');

        return res.status(200).json({ success: true, call: populated });
      }
    }

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver ID is required' });
    }

    const newCall = await Call.create({
      caller: req.user._id,
      receiver: receiverId,
      callType: callType || 'audio',
      status: status || 'completed',
      duration: duration || 0,
      startTime: startTime || new Date(),
      endTime: endTime || (status === 'completed' ? new Date() : undefined),
    });

    const populated = await Call.findById(newCall._id)
      .populate('caller', 'name username email avatar phoneNumber isOnline')
      .populate('receiver', 'name username email avatar phoneNumber isOnline');

    res.status(201).json({ success: true, call: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete single call log
// @route   DELETE /api/calls/:id
export const deleteCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call log not found' });
    }

    if (
      call.caller.toString() !== req.user._id.toString() &&
      call.receiver.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this call log' });
    }

    await Call.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Call log deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all call history for user
// @route   DELETE /api/calls
export const clearCallHistory = async (req, res) => {
  try {
    await Call.deleteMany({
      $or: [{ caller: req.user._id }, { receiver: req.user._id }],
    });
    res.status(200).json({ success: true, message: 'Call history cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
