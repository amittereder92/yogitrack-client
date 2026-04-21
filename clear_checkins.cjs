require('dotenv').config();
require('./src/config/mongodbconn.cjs');
const Checkin = require('./src/models/checkinModel.cjs');

setTimeout(async () => {
  const count  = await Checkin.countDocuments({});
  console.log(`Found ${count} check-in records.`);

  const answer = process.argv[2];
  if (answer !== '--confirm') {
    console.log('Run with --confirm to delete all check-ins:');
    console.log('  node clear_checkins.cjs --confirm');
    process.exit();
  }

  await Checkin.deleteMany({});
  console.log(`✅ All ${count} check-in records deleted.`);
  process.exit();
}, 2000);
