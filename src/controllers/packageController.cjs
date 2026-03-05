const Package = require("../models/packageModel.cjs");

exports.getPackage = async (req, res) => {
  try {
    const { packageId } = req.query;
    const pkg = await Package.findOne({ packageId });
    res.json(pkg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getPackageIds = async (req, res) => {
  try {
    const packages = await Package.find({}, { packageId: 1, packageName: 1, _id: 0 }).sort({ packageId: 1 });
    res.json(packages);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getNextId = async (req, res) => {
  try {
    const packages = await Package.find({});
    let maxNumber = 0;
    packages.forEach((pkg) => {
      const match = pkg.packageId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextId = `P${String(maxNumber + 1).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { packageId, packageName, description, price } = req.body;
    if (!packageName || price === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newPackage = new Package({ packageId, packageName, description, price });
    await newPackage.save();
    res.status(201).json({ message: "Package added successfully", package: newPackage });
  } catch (err) {
    res.status(500).json({ message: "Failed to add package", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { packageId } = req.query;
    const { packageName, description, price } = req.body;
    const updated = await Package.findOneAndUpdate(
      { packageId },
      { packageName, description, price },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Package not found" });
    res.json({ message: "Package updated", package: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update package", error: err.message });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    const { packageId } = req.query;
    const result = await Package.findOneAndDelete({ packageId });
    if (!result) return res.status(404).json({ error: "Package not found" });
    res.json({ message: "Package deleted", packageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
