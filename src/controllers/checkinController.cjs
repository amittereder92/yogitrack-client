const Checkin = require("../models/checkinModel.cjs");

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
    const checkins = await Checkin.find({});
    let maxNumber = 0;
    checkins.forEach((c) => {
      const match = c.checkinId.match(/\d+$/);
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
    if (!customerId || !classId || !instructorId || !checkinDatetime) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newCheckin = new Checkin({ checkinId, customerId, classId, instructorId, checkinDatetime });
    await newCheckin.save();
    res.status(201).json({ message: "Check-in added successfully", checkin: newCheckin });
  } catch (err) {
    res.status(500).json({ message: "Failed to add check-in", error: err.message });
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
