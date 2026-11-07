const { isValidObjectId } = require("mongoose");
const FleetVehicle = require("../models/FleetVehicle");

const VEHICLE_TYPES = ["Car", "Van", "Bus", "Truck", "Other"];
const VEHICLE_STATUSES = ["Available", "In Service", "Maintenance"];

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const validateVehicle = (body = {}) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    body = {};
  }
  const registrationNumber =
    typeof body.registrationNumber === "string"
      ? body.registrationNumber.trim().toUpperCase()
      : "";
  const vehicleType = body.vehicleType;
  const status = body.status || "Available";
  const capacity = Number(body.capacity);
  const insuranceExpiry = parseDate(body.insuranceExpiry);
  const registrationExpiry = parseDate(body.registrationExpiry);

  if (!registrationNumber) {
    return { error: "Registration number is required" };
  }
  if (!VEHICLE_TYPES.includes(vehicleType)) {
    return { error: "Select a valid vehicle type" };
  }
  if (!Number.isInteger(capacity) || capacity < 1) {
    return { error: "Capacity must be a whole number greater than zero" };
  }
  if (!VEHICLE_STATUSES.includes(status)) {
    return { error: "Select a valid vehicle status" };
  }
  if (insuranceExpiry === undefined || registrationExpiry === undefined) {
    return { error: "Expiry dates must be valid dates" };
  }

  return {
    data: {
      registrationNumber,
      vehicleType,
      capacity,
      status,
      insuranceExpiry,
      registrationExpiry,
    },
  };
};

const handleWriteError = (error, res) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "A vehicle with this registration number already exists",
    });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  console.error("Fleet vehicle operation failed:", error);
  return res.status(500).json({ message: "Unable to save vehicle" });
};

exports.getFleetVehicles = async (req, res) => {
  try {
    const vehicles = await FleetVehicle.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    return res.json(vehicles);
  } catch (error) {
    console.error("Fleet vehicle list failed:", error);
    return res.status(500).json({ message: "Unable to load fleet vehicles" });
  }
};

exports.addFleetVehicle = async (req, res) => {
  const { data, error } = validateVehicle(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const vehicle = await FleetVehicle.create({
      ...data,
      userId: req.user._id,
    });
    return res.status(201).json(vehicle);
  } catch (writeError) {
    return handleWriteError(writeError, res);
  }
};

exports.updateFleetVehicle = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid vehicle ID" });
  }

  const { data, error } = validateVehicle(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const vehicle = await FleetVehicle.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      data,
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    return res.json(vehicle);
  } catch (writeError) {
    return handleWriteError(writeError, res);
  }
};

exports.deleteFleetVehicle = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid vehicle ID" });
  }

  try {
    const vehicle = await FleetVehicle.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    return res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Fleet vehicle deletion failed:", error);
    return res.status(500).json({ message: "Unable to delete vehicle" });
  }
};
