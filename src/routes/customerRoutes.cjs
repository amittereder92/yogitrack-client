const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/customerController.cjs");

router.get("/getCustomer",       controller.getCustomer);
router.get("/getCustomerIds",    controller.getCustomerIds);
router.get("/getAllCustomerIds", controller.getAllCustomerIds);
router.get("/getNextId",         controller.getNextId);
router.get("/getRole",           controller.getRole);
router.get("/getInstructors",    controller.getInstructors);
router.post("/add",              controller.add);
router.put("/update",            controller.update);
router.put("/deactivate",        controller.deactivate);
router.put("/reactivate",        controller.reactivate);
router.delete("/deleteCustomer", controller.deleteCustomer);

module.exports = router;
