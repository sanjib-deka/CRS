const { isValidObjectId } = require("mongoose");
const Employee = require("../models/Employee");

const EMPLOYEE_STATUSES = ["Active", "On Leave", "Inactive"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmployee = (body = {}) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) body = {};

  const employee = {
    employeeCode:
      typeof body.employeeCode === "string"
        ? body.employeeCode.trim().toUpperCase()
        : "",
    fullName: typeof body.fullName === "string" ? body.fullName.trim() : "",
    workEmail:
      typeof body.workEmail === "string"
        ? body.workEmail.trim().toLowerCase()
        : "",
    jobTitle: typeof body.jobTitle === "string" ? body.jobTitle.trim() : "",
    department:
      typeof body.department === "string" ? body.department.trim() : "",
    status: body.status || "Active",
  };

  if (
    !employee.employeeCode ||
    !employee.fullName ||
    !employee.workEmail ||
    !employee.jobTitle ||
    !employee.department
  ) {
    return { error: "All employee fields are required" };
  }
  if (!EMAIL_PATTERN.test(employee.workEmail)) {
    return { error: "Enter a valid work email address" };
  }
  if (!EMPLOYEE_STATUSES.includes(employee.status)) {
    return { error: "Select a valid employee status" };
  }
  return { data: employee };
};

const handleWriteError = (error, res) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "Employee code or work email already exists in this workspace",
    });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  console.error("Employee operation failed:", error);
  return res.status(500).json({ message: "Unable to save employee" });
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ userId: req.user._id }).sort({
      fullName: 1,
    });
    return res.json(employees);
  } catch (error) {
    console.error("Employee list failed:", error);
    return res.status(500).json({ message: "Unable to load employees" });
  }
};

exports.addEmployee = async (req, res) => {
  const { data, error } = validateEmployee(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const employee = await Employee.create({
      ...data,
      userId: req.user._id,
    });
    return res.status(201).json(employee);
  } catch (writeError) {
    return handleWriteError(writeError, res);
  }
};

exports.updateEmployee = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid employee ID" });
  }
  const { data, error } = validateEmployee(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      data,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    return res.json(employee);
  } catch (writeError) {
    return handleWriteError(writeError, res);
  }
};

exports.deleteEmployee = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid employee ID" });
  }

  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    return res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Employee deletion failed:", error);
    return res.status(500).json({ message: "Unable to delete employee" });
  }
};
