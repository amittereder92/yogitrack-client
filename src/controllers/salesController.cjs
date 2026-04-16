const Sale     = require("../models/saleModel.cjs");
const Customer = require("../models/customerModel.cjs");
const Package  = require("../models/packageModel.cjs");

// POST /api/sales/sell
exports.sell = async (req, res) => {
  try {
    const { customerId, packageId, classesAdded, amountPaid, paymentMethod } = req.body;

    if (!customerId || !packageId) {
      return res.status(400).json({ error: "Customer and package are required." });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) return res.status(404).json({ error: "Customer not found." });

    const pkg = await Package.findOne({ packageId });
    if (!pkg) return res.status(404).json({ error: "Package not found." });

    // Get next sale ID
    const sales      = await Sale.find({});
    let maxNumber    = 0;
    sales.forEach(s => {
      const match = s.saleId?.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const saleId = `S${String(maxNumber + 1).padStart(4, "0")}`;

    const classesToAdd = parseInt(classesAdded) || pkg.classCount || 0;

    // Record the sale
    const newSale = new Sale({
      saleId,
      customerId,
      packageId,
      packageName:   pkg.packageName,
      classesAdded:  classesToAdd,
      amountPaid:    parseFloat(amountPaid) || pkg.price || 0,
      paymentMethod: paymentMethod || "cash",
      soldBy:        req.session.user?.username || "unknown",
      saleDate:      new Date().toISOString(),
    });
    await newSale.save();

    // Update customer balance
    await Customer.findOneAndUpdate(
      { customerId },
      { $inc: { classBalance: classesToAdd } }
    );

    res.json({
      success:     true,
      saleId,
      newBalance:  (customer.classBalance || 0) + classesToAdd,
      classesAdded: classesToAdd,
    });

  } catch (err) {
    console.error("Sale error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sales/history?customerId=xxx
exports.history = async (req, res) => {
  try {
    const { customerId } = req.query;
    const sales = await Sale.find({ customerId }).sort({ saleDate: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
