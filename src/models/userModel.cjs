const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("../config/mongodbconn.cjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["staff", "customer"], default: "staff" },
  customerId: { type: String, default: null }, // links to Customer record if role=customer
  displayName: { type: String, default: "" },
}, { collection: "users" });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare plaintext password to hashed
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.password);
};

module.exports = mongoose.model("User", userSchema);
