const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("../config/mongodbconn.cjs");

const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ["staff", "customer"], default: "staff" },
  customerId:  { type: String, default: null },
  displayName: { type: String, default: "" },
}, { collection: "users" });

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare plaintext password to hashed
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.password);
};

module.exports = mongoose.model("User", userSchema);
