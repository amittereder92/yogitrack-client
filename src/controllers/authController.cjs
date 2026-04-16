const bcrypt     = require("bcryptjs");
const User       = require("../models/userModel.cjs");
const Customer   = require("../models/customerModel.cjs");
const Instructor = require("../models/instructorModel.cjs");

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
    firstName, lastName, email, phone, address, password,
    emergencyContact, referral, mailingList,
    waiverSigned, waiverSignature, waiverDate, guardianSignature,
  } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const username = email.trim().toLowerCase();
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // Get next customer ID
    const customers  = await Customer.find({});
    let maxNumber    = 0;
    customers.forEach((c) => {
      const match = c.customerId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const customerId = `Y${String(maxNumber + 1).padStart(3, "0")}`;

    // Create customer record with all registration fields
    const newCustomer = new Customer({
      customerId,
      firstName:        firstName.trim(),
      lastName:         lastName.trim(),
      email:            username,
      phone:            phone || "",
      address:          address || "",
      classBalance:     0,
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

    return res.json({ success: true, customerId });

  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ error: "Registration failed. Please try again." });
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

module.exports = { login, register, logout, me, requireStaff, requireLogin };
