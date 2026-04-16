const Checkin  = require("../models/checkinModel.cjs");
const Customer = require("../models/customerModel.cjs");
const Package  = require("../models/packageModel.cjs");
const Class    = require("../models/scheduleModel.cjs");
const User     = require("../models/userModel.cjs");

const PAY_BASE       = 25;
const PAY_PER_STUDENT = 5;
const PAY_MAX_STUDENTS = 12;

// GET /api/reports/sales?start=&end=
exports.sales = async (req, res) => {
  try {
    const { start, end } = req.query;

    // Get all packages
    const packages = await Package.find({});

    // Since we don't have a sales/transaction collection yet,
    // we calculate based on customer class balances vs packages
    // For now return package list with placeholder sold counts
    // When package purchase is implemented this will use real transaction data
    const result = packages.map(p => ({
      package_name: p.packageName,
      sold:         0,
      revenue:      (0 * (p.price || 0)).toFixed(2),
    }));

    res.json(result);
  } catch (err) {
    console.error("Sales report error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/reports/instructors?start=&end=
exports.instructors = async (req, res) => {
  try {
    const { start, end } = req.query;

    // Get all instructors (customers with instructor role)
    const instrUsers = await User.find({ role: "instructor" });
    const instrCustomerIds = instrUsers.map(u => u.customerId).filter(Boolean);
    const instrCustomers = await Customer.find({ customerId: { $in: instrCustomerIds } });

    // Get all classes
    const classes = await Class.find({});

    // Get checkins filtered by date range
    let checkins = await Checkin.find({});
    if (start) checkins = checkins.filter(c => c.checkinDatetime >= start);
    if (end)   checkins = checkins.filter(c => c.checkinDatetime <= end + "T23:59:59");

    const result = [];

    instrCustomers.forEach(instr => {
      // Find classes assigned to this instructor
      const instrClasses = classes.filter(c => c.instructorId === instr.customerId);

      if (instrClasses.length === 0) {
        result.push({
          instructor: `${instr.firstName} ${instr.lastName}`,
          class_name: "No classes assigned",
          checkins:   0,
        });
      } else {
        instrClasses.forEach(cls => {
          const classCheckins = checkins.filter(ci => ci.classId === cls.classId).length;
          result.push({
            instructor: `${instr.firstName} ${instr.lastName}`,
            class_name: cls.className,
            checkins:   classCheckins,
          });
        });
      }
    });

    res.json(result);
  } catch (err) {
    console.error("Instructor report error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/reports/customers
exports.customers = async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ lastName: 1 });
    const packages  = await Package.find({});

    const result = customers.map(c => {
      const bal    = c.classBalance || 0;
      let status   = "Active";
      if (bal === 0)     status = "Empty — needs renewal";
      else if (bal <= 2) status = `Low (${bal} left)`;
      else               status = `Active (${bal} left)`;

      return {
        customer: `${c.firstName} ${c.lastName}`,
        package:  bal > 0 ? `${bal} class${bal !== 1 ? "es" : ""} remaining` : "No classes",
        status,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Customer report error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/reports/payments?start=&end=
exports.payments = async (req, res) => {
  try {
    const { start, end } = req.query;

    // Get all instructors
    const instrUsers     = await User.find({ role: "instructor" });
    const instrCustomerIds = instrUsers.map(u => u.customerId).filter(Boolean);
    const instrCustomers = await Customer.find({ customerId: { $in: instrCustomerIds } });

    // Get all checkins filtered by date
    let checkins = await Checkin.find({});
    if (start) checkins = checkins.filter(c => c.checkinDatetime >= start);
    if (end)   checkins = checkins.filter(c => c.checkinDatetime <= end + "T23:59:59");

    // Get all classes
    const classes = await Class.find({});

    // Determine month label
    const monthLabel = start
      ? new Date(start).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "All Time";

    const result = [];

    instrCustomers.forEach(instr => {
      const instrClasses   = classes.filter(c => c.instructorId === instr.customerId);
      const classCount     = instrClasses.length;

      // Count unique class sessions with at least one check-in
      const instrClassIds  = instrClasses.map(c => c.classId);
      const instrCheckins  = checkins.filter(ci => instrClassIds.includes(ci.classId));

      // Group checkins by classId to count sessions
      const sessionMap = {};
      instrCheckins.forEach(ci => {
        const dateKey = ci.checkinDatetime ? ci.checkinDatetime.slice(0, 10) : "unknown";
        const key     = `${ci.classId}_${dateKey}`;
        if (!sessionMap[key]) sessionMap[key] = 0;
        sessionMap[key]++;
      });

      const sessions = Object.keys(sessionMap);
      let totalPay   = 0;

      sessions.forEach(key => {
        const studentCount = Math.min(sessionMap[key], PAY_MAX_STUDENTS);
        const sessionPay   = PAY_BASE + (studentCount * PAY_PER_STUDENT);
        totalPay          += sessionPay;
      });

      result.push({
        instructor: `${instr.firstName} ${instr.lastName}`,
        month:      monthLabel,
        classes:    classCount,
        checkins:   instrCheckins.length,
        pay_rate:   `${PAY_BASE}–${PAY_BASE + PAY_PER_STUDENT * PAY_MAX_STUDENTS}`,
        total_pay:  totalPay.toFixed(2),
      });
    });

    res.json(result);
  } catch (err) {
    console.error("Payments report error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
