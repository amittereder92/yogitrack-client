const crypto   = require("crypto");
const QRCode   = require("qrcode");
const Class    = require("../models/scheduleModel.cjs");
const Checkin  = require("../models/checkinModel.cjs");
const Customer = require("../models/customerModel.cjs");

// In-memory store for active QR tokens (survives restarts with MongoDB in prod)
// For production scale, store in MongoDB instead
const activeTokens = new Map();

// POST /api/qr/generate
exports.generate = async (req, res) => {
  try {
    const { classId } = req.body;
    if (!classId) return res.status(400).json({ error: "classId is required" });

    const cls = await Class.findOne({ classId });
    if (!cls) return res.status(404).json({ error: "Class not found" });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Valid 30 mins before now until 30 mins from now
    const now       = new Date();
    const validFrom = new Date(now.getTime() - 30 * 60 * 1000);
    const validUntil = new Date(now.getTime() + 30 * 60 * 1000);

    // Store token
    activeTokens.set(token, {
      classId,
      className:   cls.className,
      instructorId: cls.instructorId,
      validFrom,
      validUntil,
    });

    // Auto-expire token
    setTimeout(() => activeTokens.delete(token), 60 * 60 * 1000);

    // Build check-in URL
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const checkinUrl = `${baseUrl}/checkin-qr.html?token=${token}`;

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#3d3028", light: "#f7f3ee" },
    });

    res.json({
      success: true,
      qrDataUrl,
      checkinUrl,
      className:   cls.className,
      classId,
      validUntil:  validUntil.toISOString(),
    });

  } catch (err) {
    console.error("QR generate error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/qr/validate?token=xxx
exports.validate = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token required" });

    const entry = activeTokens.get(token);
    if (!entry) return res.status(404).json({ error: "QR code not found or expired" });

    const now = new Date();
    if (now > entry.validUntil) {
      activeTokens.delete(token);
      return res.status(400).json({ error: "QR code has expired" });
    }

    res.json({
      valid:        true,
      classId:      entry.classId,
      className:    entry.className,
      instructorId: entry.instructorId,
      validUntil:   entry.validUntil.toISOString(),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/qr/checkin
exports.checkin = async (req, res) => {
  try {
    const { token, email } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });

    const entry = activeTokens.get(token);
    if (!entry) return res.status(404).json({ error: "QR code not found or expired" });

    const now = new Date();
    if (now > entry.validUntil) {
      activeTokens.delete(token);
      return res.status(400).json({ error: "QR code has expired" });
    }

    // Find customer — either from session or by email
    let customer = null;

    if (req.session.user && req.session.user.customerId) {
      customer = await Customer.findOne({ customerId: req.session.user.customerId });
    } else if (email) {
      customer = await Customer.findOne({ email: email.trim().toLowerCase() });
    }

    if (!customer) {
      return res.status(404).json({ error: "No customer found with that email. Please check and try again." });
    }

    // Check balance
    if (customer.classBalance <= 0) {
      return res.status(400).json({ error: `${customer.firstName}, you have no remaining classes. Please purchase a package.` });
    }

    // Check if already checked in for this class today
    const today = new Date().toISOString().slice(0, 10);
    const existing = await Checkin.findOne({
      customerId: customer.customerId,
      classId:    entry.classId,
      checkinDatetime: { $regex: `^${today}` },
    });
    if (existing) {
      return res.status(400).json({ error: `${customer.firstName}, you're already checked in for this class today!` });
    }

    // Get next checkin ID
    const checkins  = await Checkin.find({});
    let maxNumber   = 0;
    checkins.forEach((c) => {
      const match = c.checkinId?.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const checkinId = `CI${String(maxNumber + 1).padStart(3, "0")}`;

    // Save check-in
    const newCheckin = new Checkin({
      checkinId,
      customerId:      customer.customerId,
      classId:         entry.classId,
      instructorId:    entry.instructorId,
      checkinDatetime: new Date().toISOString(),
    });
    await newCheckin.save();

    // Deduct class balance
    await Customer.findOneAndUpdate(
      { customerId: customer.customerId },
      { $inc: { classBalance: -1 } }
    );

    res.json({
      success:      true,
      message:      `Welcome, ${customer.firstName}! You're checked in for ${entry.className}.`,
      customerName: `${customer.firstName} ${customer.lastName}`,
      className:    entry.className,
      newBalance:   customer.classBalance - 1,
    });

  } catch (err) {
    console.error("QR checkin error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
