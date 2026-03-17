const Customer = require("../models/customerModel.cjs");
const Checkin  = require("../models/checkinModel.cjs");

// GET /api/portal/me — get logged-in customer's record
exports.getMe = async (req, res) => {
  try {
    const { customerId } = req.session.user;
    if (!customerId) return res.status(403).json({ error: "Not a customer account" });
    const customer = await Customer.findOne({ customerId });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/portal/checkins — get logged-in customer's check-in history
exports.getMyCheckins = async (req, res) => {
  try {
    const { customerId } = req.session.user;
    const checkins = await Checkin.find({ customerId }).sort({ checkinDatetime: -1 }).limit(20);
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/portal/update — update logged-in customer's profile
exports.updateMe = async (req, res) => {
  try {
    const { customerId } = req.session.user;
    const { firstName, lastName, phone, address, preferredContact } = req.body;
    const updated = await Customer.findOneAndUpdate(
      { customerId },
      { firstName, lastName, phone, address, preferredContact },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Profile updated", customer: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
