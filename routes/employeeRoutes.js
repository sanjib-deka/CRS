const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

router.use(protect);
router.get("/", getEmployees);
router.post("/", addEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
