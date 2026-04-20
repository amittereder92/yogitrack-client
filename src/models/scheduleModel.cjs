const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const daytimeSchema = new mongoose.Schema({
  day:      String,
  time:     String,
  duration: Number,
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  classId:      String,
  className:    String,
  instructorId: String,
  classType:    String,
  description:  String,
  daytime:      [daytimeSchema],
  active:       { type: Boolean, default: true },
}, { collection: "class" });

module.exports = mongoose.model("Class", scheduleSchema);
