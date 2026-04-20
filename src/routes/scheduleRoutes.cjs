const express            = require("express");
const router             = express.Router();
const scheduleController = require("../controllers/scheduleController.cjs");

router.get("/getClass",        scheduleController.getClass);
router.get("/getClassIds",     scheduleController.getClassIds);
router.get("/getAllClassIds",   scheduleController.getAllClassIds);
router.get("/getNextId",       scheduleController.getNextId);
router.post("/add",            scheduleController.add);
router.put("/update",          scheduleController.update);
router.put("/deactivate",      scheduleController.deactivate);
router.put("/reactivate",      scheduleController.reactivate);
router.delete("/deleteClass",  scheduleController.deleteClass);

module.exports = router;
