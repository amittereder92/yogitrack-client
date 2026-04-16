const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const saleSchema = new mongoose.Schema({
  saleId:        String,
  customerId:    String,
  packageId:     String,
  packageName:   String,
  classesAdded:  Number,
  amountPaid:    Number,
  paymentMethod: String, // "cash" or "card"
  soldBy:        String, // username of staff/instructor
  saleDate:      String,
}, { collection: "sales" });

module.exports = mongoose.model("Sale", saleSchema);
