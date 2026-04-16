const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/customerController.cjs");

router.get("/getCustomer",    controller.getCustomer);
router.get("/getCustomerIds", controller.getCustomerIds);
router.get("/getNextId",      controller.getNextId);
router.get("/getRole",        controller.getRole);
router.post("/add",           controller.add);
router.put("/update",         controller.update);
router.delete("/deleteCustomer", controller.deleteCustomer);

module.exports = router;
