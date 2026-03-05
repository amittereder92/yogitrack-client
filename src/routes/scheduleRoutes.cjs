const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController.cjs");

router.get("/getClass", scheduleController.getClass);
router.get("/getClassIds", scheduleController.getClassIds);
router.get("/getNextId", scheduleController.getNextId);
router.post("/add", scheduleController.add);
router.put("/update", scheduleController.update);
router.delete("/deleteClass", scheduleController.deleteClass);

module.exports = router;
