const Customer = require("../models/customerModel.cjs");

exports.getCustomer = async (req, res) => {
  try {
    const { customerId } = req.query;
    const customer = await Customer.findOne({ customerId });
    res.json(customer);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getCustomerIds = async (req, res) => {
  try {
    const customers = await Customer.find({}, { customerId: 1, firstName: 1, lastName: 1, _id: 0 }).sort({ customerId: 1 });
    res.json(customers);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getNextId = async (req, res) => {
  try {
    const customers = await Customer.find({});
    let maxNumber = 0;
    customers.forEach((c) => {
      const match = c.customerId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextId = `Y${String(maxNumber + 1).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { customerId, firstName, lastName, email, phone, address, senior, preferredContact, classBalance } = req.body;
    if (!firstName || !lastName) return res.status(400).json({ message: "Missing required fields" });
    const newCustomer = new Customer({ customerId, firstName, lastName, email, phone, address, senior, preferredContact, classBalance });
    await newCustomer.save();
    res.status(201).json({ message: "Customer added successfully", customer: newCustomer });
  } catch (err) {
    res.status(500).json({ message: "Failed to add customer", error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { customerId } = req.query;
    const { firstName, lastName, email, phone, address, senior, preferredContact, classBalance } = req.body;
    const updated = await Customer.findOneAndUpdate(
      { customerId },
      { firstName, lastName, email, phone, address, senior, preferredContact, classBalance },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer updated", customer: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update customer", error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.query;
    const result = await Customer.findOneAndDelete({ customerId });
    if (!result) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer deleted", customerId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
