require('dotenv').config();
require('./src/config/mongodbconn.cjs');
const Checkin = require('./src/models/checkinModel.cjs');

setTimeout(async () => {
  const checkins = await Checkin.find({}).sort({ checkinDatetime: -1 });
  console.log("=== CHECKINS ===");
  console.log(JSON.stringify(checkins, null, 2));
  process.exit();
}, 2000);
