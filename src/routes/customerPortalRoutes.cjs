const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/customerPortalController.cjs");
const { requireLogin } = require("../controllers/authController.cjs");

router.get("/me",       requireLogin, controller.getMe);
router.get("/checkins", requireLogin, controller.getMyCheckins);
router.put("/update",   requireLogin, controller.updateMe);

module.exports = router;
