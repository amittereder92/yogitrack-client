const Checkin  = require("../models/checkinModel.cjs");
const Customer = require("../models/customerModel.cjs");
const Package  = require("../models/packageModel.cjs");
const Class    = require("../models/scheduleModel.cjs");
const User     = require("../models/userModel.cjs");
const Sale     = require("../models/saleModel.cjs");

const DAYS_ORDER = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_FULL   = { Sun:"Sunday", Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday" };

// Pay formula: max($25, min($60, students × $5))
function calcSessionPay(studentCount) {
  return Math.max(25, Math.min(60, studentCount * 5));
}

function fmtTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hh = parseInt(h), mm = parseInt(m);
  return `${hh % 12 || 12}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`;
}

// Count how many times a specific weekday (0=Sun..6=Sat) occurs in the date range
function countWeekdayOccurrences(start, end, weekdayIndex) {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    if (cur.getDay() === weekdayIndex) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
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
      return { package_name: p.packageName, sold, revenue: revenue.toFixed(2) };
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

    // Pre-calculate how many times each weekday occurs in the date range
    const weekdayCounts = {};
    DAYS_ORDER.forEach((d, i) => {
      weekdayCounts[d] = countWeekdayOccurrences(start, end, i);
    });

    // Build result grouped by day
    const byDay = {};
    DAYS_ORDER.forEach(d => byDay[d] = []);

    instrCustomers.forEach(instr => {
      const instrClasses = classes.filter(c => c.instructorId === instr.customerId);
      if (!instrClasses.length) return;

      instrClasses.forEach(cls => {
        const slots = cls.daytime && cls.daytime.length ? cls.daytime : [{ day: "—", time: "" }];
        slots.forEach(slot => {
          // Count checkins for this class that fall on this day of week
          const dayCheckins = checkins.filter(ci => {
            if (ci.classId !== cls.classId || ci.refunded) return false;
            if (!slot.day || slot.day === "—") return true;
            const ciDay = DAYS_ORDER[new Date(ci.checkinDatetime).getDay()];
            return ciDay === slot.day;
          }).length;

          // Avg = checkins / number of times that weekday occurred in range
          const occurrences = weekdayCounts[slot.day];
          const avg = occurrences ? (dayCheckins / occurrences).toFixed(1) : "—";

          const row = {
            instructor:   `${instr.firstName} ${instr.lastName}`,
            day:          slot.day || "—",
            time:         slot.time ? fmtTime(slot.time) : "—",
            class_name:   cls.className,
            checkins:     dayCheckins,
            avg_per_week: avg,
          };

          if (byDay[slot.day] !== undefined) {
            byDay[slot.day].push(row);
          }
        });
      });
    });

    // Sort each day by time
    DAYS_ORDER.forEach(d => {
      byDay[d].sort((a, b) => a.time.localeCompare(b.time));
    });

    res.json({ byDay, weekdayCounts });
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
      if (bal < 0)        status = `Negative (${bal})`;
      else if (bal === 0) status = "Empty — needs renewal";
      else if (bal <= 2)  status = `Low (${bal} left)`;
      else                status = `Active (${bal} left)`;

      return {
        customer: `${c.firstName} ${c.lastName}`,
        balance:  bal,
        status,
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
      const instrCheckins = checkins.filter(ci => instrClassIds.includes(ci.classId) && !ci.refunded);

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

      result.push({
        instructor: `${instr.firstName} ${instr.lastName}`,
        month:      monthLabel,
        classes:    instrClasses.length,
        sessions:   Object.keys(sessionMap).length,
        checkins:   instrCheckins.length,
        pay_rate:   "$25–$60 per session",
        total_pay:  totalPay.toFixed(2),
      });
    });

    res.json(result);
  } catch (err) {
    console.error("Payments report error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
