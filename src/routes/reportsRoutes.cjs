const express    = require("express");
const router     = express.Router();
const reports    = require("../controllers/reportsController.cjs");
const { requireStaff } = require("../controllers/authController.cjs");

router.get("/sales",        requireStaff, reports.sales);
router.get("/instructors",  requireStaff, reports.instructors);
router.get("/customers",    requireStaff, reports.customers);
router.get("/payments",     requireStaff, reports.payments);

module.exports = router;
