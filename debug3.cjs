require('dotenv').config();
require('./src/config/mongodbconn.cjs');
const Checkin  = require('./src/models/checkinModel.cjs');
const Customer = require('./src/models/customerModel.cjs');
const Package  = require('./src/models/packageModel.cjs');
const Class    = require('./src/models/scheduleModel.cjs');
const User     = require('./src/models/userModel.cjs');
const Sale     = require('./src/models/saleModel.cjs');

setTimeout(async () => {
  const checkins   = await Checkin.find({});
  const customers  = await Customer.find({});
  const packages   = await Package.find({});
  const classes    = await Class.find({});
  const instrUsers = await User.find({ role: "instructor" });
  const sales      = await Sale.find({});

  console.log("Checkins:",   checkins.length);
  console.log("Customers:",  customers.length);
  console.log("Packages:",   packages.length);
  console.log("Classes:",    classes.length);
  console.log("Instructors:", instrUsers.length);
  console.log("Sales:",      sales.length);
  console.log("\nSample checkin:", checkins[0]);
  console.log("Sample class:", classes[0]);
  console.log("Instructor users:", JSON.stringify(instrUsers.map(u => ({ username: u.username, customerId: u.customerId }))));
  process.exit();
}, 2000);
