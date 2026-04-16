const express  = require("express");
const router   = express.Router();
const sales    = require("../controllers/salesController.cjs");
const { requireLogin } = require("../controllers/authController.cjs");

router.post("/sell",    requireLogin, sales.sell);
router.get("/history",  requireLogin, sales.history);

module.exports = router;
