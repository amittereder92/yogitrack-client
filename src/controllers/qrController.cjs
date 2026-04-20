const crypto       = require("crypto");
const QRCode       = require("qrcode");
const Class        = require("../models/scheduleModel.cjs");
const Checkin      = require("../models/checkinModel.cjs");
const Customer     = require("../models/customerModel.cjs");
const emailService = require("../utils/emailService.cjs");

const MIN_BALANCE = -5;
const activeTokens = new Map();

// POST /api/qr/generate
exports.generate = async (req, res) => {
  try {
    const { classId } = req.body;
    if (!classId) return res.status(400).json({ error: "classId is required" });

    const cls = await Class.findOne({ classId });
    if (!cls) return res.status(404).json({ error: "Class not found" });

    const token      = crypto.randomBytes(32).toString("hex");
    const now        = new Date();
    const validUntil = new Date(now.getTime() + 30 * 60 * 1000);

    activeTokens.set(token, {
      classId,
      className:    cls.className,
      instructorId: cls.instructorId,
      validFrom:    new Date(now.getTime() - 30 * 60 * 1000),
      validUntil,
    });

    setTimeout(() => activeTokens.delete(token), 60 * 60 * 1000);

    const baseUrl    = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const checkinUrl = `${baseUrl}/htmls/checkin-qr.html?token=${token}`;

    const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
      width: 400, margin: 2,
      color: { dark: "#3d3028", light: "#f7f3ee" },
    });

    res.json({
      success: true, qrDataUrl, checkinUrl,
      className: cls.className, classId,
      validUntil: validUntil.toISOString(),
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

    // Find customer
    let customer = null;
    if (req.session.user && req.session.user.customerId) {
      customer = await Customer.findOne({ customerId: req.session.user.customerId });
    } else if (email) {
      customer = await Customer.findOne({ email: email.trim().toLowerCase() });
    }

    if (!customer) {
      return res.status(404).json({ error: "No customer found with that email. Please check and try again." });
    }

    // Block if at minimum balance
    if (customer.classBalance <= MIN_BALANCE) {
      return res.status(400).json({
        error: `${customer.firstName}, your account balance is at the minimum limit (${MIN_BALANCE}). Please see the front desk to update your package.`
      });
    }

    // Check duplicate
    const today    = new Date().toISOString().slice(0, 10);
    const existing = await Checkin.findOne({
      customerId: customer.customerId,
      classId:    entry.classId,
      checkinDatetime: { $regex: `^${today}` },
    });
    if (existing) {
      return res.status(400).json({ error: `${customer.firstName}, you're already checked in for this class today!` });
    }

    // Get next checkin ID
    const checkins = await Checkin.find({});
    let maxNumber  = 0;
    checkins.forEach((c) => {
      const match = c.checkinId?.match(/\d+$/);
      if (match) { const num = parseInt(match[0]); if (num > maxNumber) maxNumber = num; }
    });
    const checkinId = `CI${String(maxNumber + 1).padStart(3, "0")}`;

    const checkinDatetime = new Date().toISOString();

    // Save check-in
    await new Checkin({
      checkinId,
      customerId:      customer.customerId,
      classId:         entry.classId,
      instructorId:    entry.instructorId,
      checkinDatetime,
    }).save();

    // Deduct balance
    await Customer.findOneAndUpdate(
      { customerId: customer.customerId },
      { $inc: { classBalance: -1 } }
    );

    const newBalance = customer.classBalance - 1;

    // Send check-in confirmation email (non-blocking)
    if (customer.email) {
      emailService.sendCheckinEmail({
        firstName:       customer.firstName,
        email:           customer.email,
        className:       entry.className,
        checkinDatetime,
        newBalance,
      }).catch(err => console.error("Check-in email failed:", err.message));
    }

    // Build response message
    let message = `Welcome, ${customer.firstName}! You're checked in for ${entry.className}.`;
    if (newBalance < 0) {
      message += ` Your balance is now ${newBalance} — please see the front desk to purchase a package.`;
    } else if (newBalance === 0) {
      message += ` You have no classes remaining — consider purchasing a package soon.`;
    }

    res.json({
      success:      true,
      message,
      customerName: `${customer.firstName} ${customer.lastName}`,
      className:    entry.className,
      newBalance,
      warning:      newBalance <= 0,
    });

  } catch (err) {
    console.error("QR checkin error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
