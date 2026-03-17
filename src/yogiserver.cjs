require('dotenv').config();

const express = require("express");
const session = require("express-session");
const app     = express();

require("./config/mongodbconn.cjs");

app.use(express.static(__dirname + "/public"));
app.use(express.json());

// Session middleware
app.use(session({
  secret:            process.env.SESSION_SECRET || "yogitrack-secret-key",
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   false, // set to true if using HTTPS in production
    httpOnly: true,
    maxAge:   1000 * 60 * 60 * 8, // 8 hours
  }
}));

// Routes
app.use("/api/auth",       require("./routes/authRoutes.cjs"));
app.use("/api/instructor", require("./routes/instructorRoutes.cjs"));
app.use("/api/package",    require("./routes/packageRoutes.cjs"));
app.use("/api/schedule",   require("./routes/scheduleRoutes.cjs"));
app.use("/api/customer",   require("./routes/customerRoutes.cjs"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}...`);
  console.log("Open http://localhost:8080/index.html in your browser to view the app.");
});
