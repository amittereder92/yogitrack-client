const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const resetTokenSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  token:     { type: String, required: true },
  expiresAt: { type: Date,   required: true },
}, { collection: "resetTokens" });

module.exports = mongoose.model("ResetToken", resetTokenSchema);
