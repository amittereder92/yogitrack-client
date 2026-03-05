const Class = require("../models/scheduleModel.cjs");

exports.getClass = async (req, res) => {
  try {
    const { classId } = req.query;
    const cls = await Class.findOne({ classId });
    res.json(cls);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getClassIds = async (req, res) => {
  try {
    const classes = await Class.find({}, { classId: 1, className: 1, _id: 0 }).sort({ classId: 1 });
    res.json(classes);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getNextId = async (req, res) => {
  try {
    const classes = await Class.find({});
    let maxNumber = 0;
    classes.forEach((c) => {
      const match = c.classId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextId = `A${String(maxNumber + 1).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { classId, className, instructorId, classType, description, daytime } = req.body;
    if (!className) return res.status(400).json({ message: "Missing required fields" });
    const newClass = new Class({ classId, className, instructorId, classType, description, daytime });
    await newClass.save();
    res.status(201).json({ message: "Class added successfully", class: newClass });
  } catch (err) {
    res.status(500).json({ message: "Failed to add class", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { classId } = req.query;
    const { className, instructorId, classType, description, daytime } = req.body;
    const updated = await Class.findOneAndUpdate(
      { classId },
      { className, instructorId, classType, description, daytime },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Class not found" });
    res.json({ message: "Class updated", class: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update class", error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { classId } = req.query;
    const result = await Class.findOneAndDelete({ classId });
    if (!result) return res.status(404).json({ error: "Class not found" });
    res.json({ message: "Class deleted", classId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
