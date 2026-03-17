const User = require("../models/userModel.cjs");

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Store user info in session
    req.session.user = {
      id:          user._id,
      username:    user.username,
      role:        user.role,
      customerId:  user.customerId,
      displayName: user.displayName,
    };

    return res.json({
      success: true,
      role:    user.role,
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

// GET /api/auth/me — check who is logged in
const me = (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  return res.json({ loggedIn: false });
};

// Middleware — protect staff-only pages
const requireStaff = (req, res, next) => {
  if (req.session.user && req.session.user.role === "staff") return next();
  return res.status(403).json({ error: "Staff access required." });
};

// Middleware — protect any logged-in user
const requireLogin = (req, res, next) => {
  if (req.session.user) return next();
  return res.status(401).json({ error: "Please log in." });
};

module.exports = { login, logout, me, requireStaff, requireLogin };
