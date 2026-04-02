const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const checkinSchema = new mongoose.Schema({
  checkinId:       String,
  customerId:      String,
  classId:         String,
  instructorId:    String,
  checkinDatetime: String,
}, { collection: "checkin" });

module.exports = mongoose.model("Checkin", checkinSchema);
