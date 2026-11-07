const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addPurchaseRequest,
  deletePurchaseRequest,
  getPurchaseRequests,
  updatePurchaseRequest,
} = require("../controllers/procurementController");

const router = express.Router();

router.use(protect);
router.get("/", getPurchaseRequests);
router.post("/", addPurchaseRequest);
router.put("/:id", updatePurchaseRequest);
router.delete("/:id", deletePurchaseRequest);

module.exports = router;
