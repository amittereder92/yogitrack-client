const express = require("express");
const router  = express.Router();
const qr      = require("../controllers/qrController.cjs");

// Staff and instructors can generate QR codes
const requireStaffOrInstructor = (req, res, next) => {
  if (req.session.user && (req.session.user.role === 'staff' || req.session.user.role === 'instructor')) {
    return next();
  }
  return res.status(403).json({ error: "Staff or instructor access required." });
};

router.post("/generate", requireStaffOrInstructor, qr.generate);
router.get("/validate",  qr.validate);
router.post("/checkin",  qr.checkin);

module.exports = router;
