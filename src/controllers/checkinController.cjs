const Checkin      = require("../models/checkinModel.cjs");
const Customer     = require("../models/customerModel.cjs");
const Class        = require("../models/scheduleModel.cjs");
const emailService = require("../utils/emailService.cjs");

exports.getCheckins = async (req, res) => {
  try {
    const checkins = await Checkin.find({}).sort({ checkinDatetime: -1 });
    res.json(checkins);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getNextId = async (req, res) => {
  try {
    const checkins = await Checkin.find({}, { checkinId: 1 });
    let maxNumber = 0;
    checkins.forEach((c) => {
      const match = c.checkinId?.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextId = `CI${String(maxNumber + 1).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { checkinId, customerId, classId, instructorId, checkinDatetime } = req.body;
    if (!customerId || !classId || !checkinDatetime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newCheckin = new Checkin({ checkinId, customerId, classId, instructorId, checkinDatetime, refunded: false });
    await newCheckin.save();

    // Send check-in confirmation email (non-blocking)
    try {
      const customer = await Customer.findOne({ customerId });
      const cls      = await Class.findOne({ classId });
      if (customer && customer.email && cls) {
        emailService.sendCheckinEmail({
          firstName:       customer.firstName,
          email:           customer.email,
          className:       cls.className,
          checkinDatetime,
          newBalance:      customer.classBalance,
        }).catch(err => console.error("Check-in email failed:", err.message));
      }
    } catch (emailErr) {
      console.error("Check-in email lookup failed:", emailErr.message);
    }

    res.status(201).json({ message: "Check-in added successfully", checkin: newCheckin });
  } catch (err) {
    res.status(500).json({ message: "Failed to add check-in", error: err.message });
  }
};

// PUT /api/checkin/refund?checkinId=xxx
exports.refund = async (req, res) => {
  try {
    const { checkinId } = req.query;

    const checkin = await Checkin.findOne({ checkinId });
    if (!checkin) return res.status(404).json({ error: "Check-in not found" });
    if (checkin.refunded) return res.status(400).json({ error: "This check-in has already been refunded." });

    // Mark as refunded
    const refundedBy = req.session?.user?.displayName || req.session?.user?.username || 'Unknown';
    await Checkin.findOneAndUpdate(
      { checkinId },
      { refunded: true, refundedAt: new Date().toISOString(), refundedBy }
    );

    // Add 1 class back to customer balance
    const customer = await Customer.findOne({ customerId: checkin.customerId });
    if (customer) {
      await Customer.findOneAndUpdate(
        { customerId: checkin.customerId },
        { $inc: { classBalance: 1 } }
      );
    }

    const newBalance = (customer?.classBalance || 0) + 1;

    res.json({
      success:    true,
      message:    `Check-in ${checkinId} refunded. Balance restored to ${newBalance}.`,
      newBalance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCheckin = async (req, res) => {
  try {
    const { checkinId } = req.query;
    const result = await Checkin.findOneAndDelete({ checkinId });
    if (!result) return res.status(404).json({ error: "Check-in not found" });
    res.json({ message: "Check-in deleted", checkinId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
