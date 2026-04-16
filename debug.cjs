require('dotenv').config();
require('./src/config/mongodbconn.cjs');
const User     = require('./src/models/userModel.cjs');
const Customer = require('./src/models/customerModel.cjs');

setTimeout(async () => {
  const users     = await User.find({}, { username: 1, role: 1, customerId: 1 });
  const customers = await Customer.find({}, { customerId: 1, firstName: 1, lastName: 1, email: 1 });
  console.log("=== USERS ===");
  console.log(JSON.stringify(users, null, 2));
  console.log("=== CUSTOMERS ===");
  console.log(JSON.stringify(customers, null, 2));
  process.exit();
}, 2000);
