const express = require("express");
const router  = express.Router();
const { login, register, forgotPassword, resetPassword, logout, me } = require("../controllers/authController.cjs");

router.post("/login",           login);
router.post("/register",        register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password",  resetPassword);
router.post("/logout",          logout);
router.get("/me",               me);

module.exports = router;
