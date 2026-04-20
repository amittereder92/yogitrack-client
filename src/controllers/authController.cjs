const bcrypt      = require("bcryptjs");
const crypto      = require("crypto");
const User        = require("../models/userModel.cjs");
const Customer    = require("../models/customerModel.cjs");
const Instructor  = require("../models/instructorModel.cjs");
const ResetToken  = require("../models/resetTokenModel.cjs");
const email       = require("../utils/emailService.cjs");

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt for:", username);

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    let user = await User.findOne({ username: username.trim().toLowerCase() });

    if (!user) {
      const customer = await Customer.findOne({ email: username.trim().toLowerCase() });
      if (customer) {
        user = await User.findOne({ customerId: customer.customerId, role: "customer" });
      }
    }

    if (!user) {
      const instructor = await Instructor.findOne({ email: username.trim().toLowerCase() });
      if (instructor) {
        user = await User.findOne({ instructorId: instructor.instructorId, role: "instructor" });
      }
    }

    console.log("User found:", user ? user.username : "NOT FOUND");

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log("Password match:", match);

    if (!match) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    req.session.user = {
      id:           user._id,
      username:     user.username,
      role:         user.role,
      customerId:   user.customerId,
      instructorId: user.instructorId,
      displayName:  user.displayName,
    };

    const redirectMap = {
      staff:      "/htmls/dashboard.html",
      customer:   "/htmls/customer-portal.html",
      instructor: "/htmls/instructor-portal.html",
    };

    return res.json({
      success:  true,
      role:     user.role,
      redirect: redirectMap[user.role] || "/index.html",
    });

  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  const {
    firstName, lastName, email: emailAddr, phone, address, password,
    emergencyContact, referral, mailingList, isUnder18, senior,
    waiverSigned, waiverSignature, waiverDate, guardianSignature,
  } = req.body;

  if (!firstName || !lastName || !emailAddr || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const username = emailAddr.trim().toLowerCase();
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // Get next customer ID
    const customers = await Customer.find({});
    let maxNumber   = 0;
    customers.forEach((c) => {
      const match = c.customerId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const customerId = `Y${String(maxNumber + 1).padStart(3, "0")}`;

    // Create customer record
    const newCustomer = new Customer({
      customerId,
      firstName:        firstName.trim(),
      lastName:         lastName.trim(),
      email:            username,
      phone:            phone || "",
      address:          address || "",
      classBalance:     0,
      senior:           senior || false,
      emergencyContact: emergencyContact || {},
      referral:         referral || "",
      mailingList:      mailingList || false,
      waiverSigned:     waiverSigned || false,
      waiverSignature:  waiverSignature || "",
      waiverDate:       waiverDate || null,
      guardianSignature: guardianSignature || "",
    });
    await newCustomer.save();

    // Create user account
    const newUser = new User({
      username,
      password,
      role:        "customer",
      customerId,
      displayName: `${firstName} ${lastName}`,
    });
    await newUser.save();

    // Send welcome email (non-blocking)
    email.sendWelcomeEmail({
      firstName, lastName,
      email:      username,
      customerId,
    }).catch(err => console.error("Welcome email failed:", err.message));

    return res.json({ success: true, customerId });

  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email: emailAddr } = req.body;
  if (!emailAddr) return res.status(400).json({ error: "Email is required." });

  try {
    const username = emailAddr.trim().toLowerCase();
    const user     = await User.findOne({ username });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    }

    // Get customer name
    const customer = await Customer.findOne({ customerId: user.customerId });
    const firstName = customer ? customer.firstName : "Member";

    // Generate token
    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this email
    await ResetToken.deleteMany({ email: username });

    // Save new token
    await new ResetToken({ email: username, token, expiresAt }).save();

    // Build reset URL
    const baseUrl  = process.env.APP_URL || "https://yogitrack-client-94e5a811253b.herokuapp.com";
    const resetUrl = `${baseUrl}/reset-password.html?token=${token}`;

    // Send email
    await email.sendPasswordResetEmail({ firstName, email: username, resetUrl });

    return res.json({ success: true, message: "If that email exists, a reset link has been sent." });

  } catch (err) {
    console.error("Forgot password error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const resetToken = await ResetToken.findOne({ token });

    if (!resetToken) {
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }
    if (new Date() > resetToken.expiresAt) {
      await ResetToken.deleteOne({ token });
      return res.status(400).json({ error: "This reset link has expired. Please request a new one." });
    }

    const user = await User.findOne({ username: resetToken.email });
    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    // Update password
    user.password = password;
    await user.save();

    // Delete used token
    await ResetToken.deleteOne({ token });

    return res.json({ success: true, message: "Password updated successfully." });

  } catch (err) {
    console.error("Reset password error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
};

// GET /api/auth/me
const me = (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  return res.json({ loggedIn: false });
};

const requireStaff = (req, res, next) => {
  if (req.session.user && req.session.user.role === "staff") return next();
  return res.status(403).json({ error: "Staff access required." });
};

const requireLogin = (req, res, next) => {
  if (req.session.user) return next();
  return res.status(401).json({ error: "Please log in." });
};

module.exports = { login, register, forgotPassword, resetPassword, logout, me, requireStaff, requireLogin };
