const express = require("express");
const router = express.Router();
const packageController = require("../controllers/packageController.cjs");

router.get("/getPackage", packageController.getPackage);
router.get("/getPackageIds", packageController.getPackageIds);
router.get("/getNextId", packageController.getNextId);
router.post("/add", packageController.add);
router.put("/update", packageController.update);
router.delete("/deletePackage", packageController.deletePackage);

module.exports = router;
