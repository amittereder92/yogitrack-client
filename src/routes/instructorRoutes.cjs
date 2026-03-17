const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructorController.cjs");

router.get("/getInstructor",    instructorController.getInstructor);
router.get("/getInstructorIds", instructorController.getInstructorIds);
router.get("/getNextId",        instructorController.getNextId);
router.post("/add",             instructorController.add);
router.put("/update",           instructorController.update);
router.delete("/deleteInstructor", instructorController.deleteInstructor);

module.exports = router;
