const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const packageSchema = new mongoose.Schema({
  packageId:   String,
  packageName: String,
  description: String,
  price:       Number,
  classCount:  Number,
}, { collection: "package" });

module.exports = mongoose.model("Package", packageSchema);
