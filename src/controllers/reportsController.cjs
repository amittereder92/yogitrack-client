const Checkin  = require("../models/checkinModel.cjs");
const Customer = require("../models/customerModel.cjs");
const Package  = require("../models/packageModel.cjs");
const Class    = require("../models/scheduleModel.cjs");
const User     = require("../models/userModel.cjs");
const Sale     = require("../models/saleModel.cjs");

// Pay formula: max($25, min($60, students × $5))
function calcSessionPay(studentCount) {
  return Math.max(25, Math.min(60, studentCount * 5));
}

// GET /api/reports/sales?start=&end=
exports.sales = async (req, res) => {
  try {
    const { start, end } = req.query;

    const packages = await Package.find({});
    let sales      = await Sale.find({});

    if (start) sales = sales.filter(s => s.saleDate >= start);
    if (end)   sales = sales.filter(s => s.saleDate <= end + "T23:59:59");

    const result = packages.map(p => {
      const pkgSales = sales.filter(s => s.packageId === p.packageId);
      const sold     = pkgSales.length;
      const revenue  = pkgSales.reduce((sum, s) => sum + (parseFloat(s.amountPaid) || 0), 0);
      return {
        package_name: p.packageName,
        sold,
        revenue: revenue.toFixed(2),
      };
    });

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

    const instrUsers       = await User.find({ role: "instructor" });
    const instrCustomerIds = instrUsers.map(u => u.customerId).filter(Boolean);
    const instrCustomers   = await Customer.find({ customerId: { $in: instrCustomerIds } });
    const classes          = await Class.find({});

    let checkins = await Checkin.find({});
    if (start) checkins = checkins.filter(c => c.checkinDatetime >= start);
    if (end)   checkins = checkins.filter(c => c.checkinDatetime <= end + "T23:59:59");

    const result = [];

    instrCustomers.forEach(instr => {
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

    const result = customers.map(c => {
      const bal = c.classBalance || 0;
      let status;
      if (bal < 0)       status = `Negative (${bal})`;
      else if (bal === 0) status = "Empty — needs renewal";
      else if (bal <= 2)  status = `Low (${bal} left)`;
      else                status = `Active (${bal} left)`;

      return {
        customer: `${c.firstName} ${c.lastName}`,
        package:  bal !== 0 ? `${bal} class${Math.abs(bal) !== 1 ? "es" : ""} remaining` : "No classes",
        status,
        balance:  bal, // pass raw balance for frontend highlighting
        active:   c.active !== false,
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

    const instrUsers       = await User.find({ role: "instructor" });
    const instrCustomerIds = instrUsers.map(u => u.customerId).filter(Boolean);
    const instrCustomers   = await Customer.find({ customerId: { $in: instrCustomerIds } });
    const classes          = await Class.find({});

    let checkins = await Checkin.find({});
    if (start) checkins = checkins.filter(c => c.checkinDatetime >= start);
    if (end)   checkins = checkins.filter(c => c.checkinDatetime <= end + "T23:59:59");

    const monthLabel = start
      ? new Date(start).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "All Time";

    const result = [];

    instrCustomers.forEach(instr => {
      const instrClasses  = classes.filter(c => c.instructorId === instr.customerId);
      const instrClassIds = instrClasses.map(c => c.classId);
      const instrCheckins = checkins.filter(ci => instrClassIds.includes(ci.classId));

      // Group checkins by class + date to get sessions
      const sessionMap = {};
      instrCheckins.forEach(ci => {
        const dateKey = ci.checkinDatetime ? ci.checkinDatetime.slice(0, 10) : "unknown";
        const key     = `${ci.classId}_${dateKey}`;
        if (!sessionMap[key]) sessionMap[key] = 0;
        sessionMap[key]++;
      });

      let totalPay = 0;
      Object.values(sessionMap).forEach(studentCount => {
        totalPay += calcSessionPay(studentCount);
      });

      const sessionCount = Object.keys(sessionMap).length;

      result.push({
        instructor:    `${instr.firstName} ${instr.lastName}`,
        month:         monthLabel,
        classes:       instrClasses.length,
        sessions:      sessionCount,
        checkins:      instrCheckins.length,
        pay_rate:      "$25–$60 per session",
        total_pay:     totalPay.toFixed(2),
      });
    });

    res.json(result);
  } catch (err) {
    console.error("Payments report error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
