const express    = require("express");
const router     = express.Router();
const qr         = require("../controllers/qrController.cjs");
const { requireStaff } = require("../controllers/authController.cjs");

router.post("/generate", requireStaff, qr.generate);
router.get("/validate",  qr.validate);
router.post("/checkin",  qr.checkin);

module.exports = router;
