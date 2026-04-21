const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const checkinSchema = new mongoose.Schema({
  checkinId:       String,
  customerId:      String,
  classId:         String,
  instructorId:    String,
  checkinDatetime: String,
  refunded:        { type: Boolean, default: false },
  refundedAt:      { type: String,  default: null },
  refundedBy:      { type: String,  default: null },
}, { collection: "checkin" });

module.exports = mongoose.model("Checkin", checkinSchema);
