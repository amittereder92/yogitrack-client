require('dotenv').config();
const express    = require("express");
const session    = require("express-session");
const MongoStore = require("connect-mongo").default;;
const app        = express();

require("./config/mongodbconn.cjs");

app.use(express.static(__dirname + "/public"));
app.use(express.json());

// Persistent session store in MongoDB
app.use(session({
  secret:            process.env.SESSION_SECRET || "yogitrack-secret-key",
  resave:            false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl:      14 * 24 * 60 * 60, // 14 days
  }),
  cookie: {
    secure:   false,
    httpOnly: true,
    maxAge:   1000 * 60 * 60 * 24 * 14,
  }
}));

// Routes
app.use("/api/auth",       require("./routes/authRoutes.cjs"));
app.use("/api/portal",     require("./routes/customerPortalRoutes.cjs"));
app.use("/api/qr",         require("./routes/qrRoutes.cjs"));
app.use("/api/reports",    require("./routes/reportsRoutes.cjs"));
app.use("/api/instructor", require("./routes/instructorRoutes.cjs"));
app.use("/api/package",    require("./routes/packageRoutes.cjs"));
app.use("/api/schedule",   require("./routes/scheduleRoutes.cjs"));
app.use("/api/customer",   require("./routes/customerRoutes.cjs"));
app.use("/api/checkin",    require("./routes/checkinRoutes.cjs"));
app.use("/api/sales",     require("./routes/salesRoutes.cjs"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}...`);
  console.log("Open http://localhost:8080/index.html in your browser to view the app.");
});
