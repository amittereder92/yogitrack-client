const bcrypt = require("bcryptjs");
const User = require("../models/userModel.cjs");

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt for:", username);

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const user = await User.findOne({ username: username.trim().toLowerCase() });
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
      redirect: "/htmls/dashboard.html",
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
