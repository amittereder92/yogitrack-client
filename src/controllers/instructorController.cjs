const Instructor = require("../models/instructorModel.cjs");

exports.getInstructor = async (req, res) => {
  try {
    const instructorId = req.query.instructorId;
    const instructor = await Instructor.findOne({ instructorId });
    res.json(instructor);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getInstructorIds = async (req, res) => {
  try {
    const instructors = await Instructor.find(
      {},
      { instructorId: 1, firstname: 1, lastname: 1, _id: 0 }
    ).sort({ instructorId: 1 });
    res.json(instructors);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getNextId = async (req, res) => {
  try {
    const last = await Instructor.find({}).sort({ instructorId: -1 }).limit(1);
    let maxNumber = 1;
    if (last.length > 0) {
      const match = last[0].instructorId.match(/\d+$/);
      if (match) maxNumber = parseInt(match[0]) + 1;
    }
    res.json({ nextId: `I${maxNumber}` });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { instructorId, firstname, lastname, email, phone, address, preferredContact } = req.body;
    if (!firstname || !lastname || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newInstructor = new Instructor({ instructorId, firstname, lastname, address, phone, email, preferredContact });
    await newInstructor.save();
    res.status(201).json({ message: "Instructor added successfully", instructor: newInstructor });
  } catch (err) {
    res.status(500).json({ message: "Failed to add instructor", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { instructorId, firstname, lastname, email, phone, address, preferredContact } = req.body;
    if (!instructorId) {
      return res.status(400).json({ message: "Instructor ID is required" });
    }
    const updated = await Instructor.findOneAndUpdate(
      { instructorId },
      { firstname, lastname, email, phone, address, preferredContact },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Instructor not found" });
    }
    res.json({ message: "Instructor updated successfully", instructor: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update instructor", error: err.message });
  }
};

exports.deleteInstructor = async (req, res) => {
  try {
    const { instructorId } = req.query;
    const result = await Instructor.findOneAndDelete({ instructorId });
    if (!result) {
      return res.status(404).json({ error: "Instructor not found" });
    }
    res.json({ message: "Instructor deleted", instructorId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
