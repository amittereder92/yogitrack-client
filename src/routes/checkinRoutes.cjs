const express            = require("express");
const router             = express.Router();
const checkinController  = require("../controllers/checkinController.cjs");

router.get("/getCheckins",    checkinController.getCheckins);
router.get("/getNextId",      checkinController.getNextId);
router.post("/add",           checkinController.add);
router.put("/refund",         checkinController.refund);
router.delete("/deleteCheckin", checkinController.deleteCheckin);

module.exports = router;
