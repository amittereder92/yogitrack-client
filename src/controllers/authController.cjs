const bcrypt   = require("bcryptjs");
const User     = require("../models/userModel.cjs");
const Customer = require("../models/customerModel.cjs");

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt for:", username);

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    // Try finding user by username first, then by email (for customers)
    let user = await User.findOne({ username: username.trim().toLowerCase() });

    // If not found by username, try email match
    if (!user) {
      user = await User.findOne({ username: username.trim().toLowerCase().replace('@', '_at_') });
    }

    // If still not found, check if it's a customer email
    if (!user) {
      const customer = await Customer.findOne({ email: username.trim().toLowerCase() });
      if (customer) {
        user = await User.findOne({ customerId: customer.customerId, role: 'customer' });
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
      id:          user._id,
      username:    user.username,
      role:        user.role,
      customerId:  user.customerId,
      displayName: user.displayName,
    };

    return res.json({
      success:  true,
      role:     user.role,
      redirect: user.role === "staff" ? "/htmls/dashboard.html" : "/htmls/customer-portal.html",
    });

  } catch (err) {
    console.error("Login error:", err.message);
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

// Middleware — staff only
const requireStaff = (req, res, next) => {
  if (req.session.user && req.session.user.role === "staff") return next();
  return res.status(403).json({ error: "Staff access required." });
};

// Middleware — any logged in user
const requireLogin = (req, res, next) => {
  if (req.session.user) return next();
  return res.status(401).json({ error: "Please log in." });
};

module.exports = { login, logout, me, requireStaff, requireLogin };
