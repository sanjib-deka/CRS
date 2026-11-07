const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addFleetVehicle,
  deleteFleetVehicle,
  getFleetVehicles,
  updateFleetVehicle,
} = require("../controllers/fleetController");

const router = express.Router();

router.use(protect);
router.get("/", getFleetVehicles);
router.post("/", addFleetVehicle);
router.put("/:id", updateFleetVehicle);
router.delete("/:id", deleteFleetVehicle);

module.exports = router;
