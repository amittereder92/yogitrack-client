const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const customerSchema = new mongoose.Schema({
  customerId:       String,
  firstName:        String,
  lastName:         String,
  email:            String,
  phone:            String,
  address:          String,
  senior:           Boolean,
  preferredContact: String,
  classBalance:     Number,
  active:           { type: Boolean, default: true },
  // Registration fields
  emergencyContact: {
    name:  String,
    phone: String,
  },
  referral:          String,
  mailingList:       Boolean,
  waiverSigned:      Boolean,
  waiverSignature:   String,
  waiverDate:        String,
  guardianSignature: String,
}, { collection: "customer" });

module.exports = mongoose.model("Customer", customerSchema);
