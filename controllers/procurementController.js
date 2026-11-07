const { isValidObjectId } = require("mongoose");
const PurchaseRequest = require("../models/PurchaseRequest");

const REQUEST_STATUSES = [
  "Draft",
  "Requested",
  "Approved",
  "Received",
  "Cancelled",
];

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const validateRequest = (body = {}) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) body = {};

  const supplier =
    typeof body.supplier === "string" ? body.supplier.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const quantity = Number(body.quantity);
  const unitCost = Number(body.unitCost);
  const status = body.status || "Draft";
  const neededBy = parseDate(body.neededBy);

  if (!supplier || !description) {
    return { error: "Supplier and item description are required" };
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "Quantity must be a whole number greater than zero" };
  }
  if (!Number.isFinite(unitCost) || unitCost <= 0) {
    return { error: "Unit cost must be greater than zero" };
  }
  if (!REQUEST_STATUSES.includes(status)) {
    return { error: "Select a valid request status" };
  }
  if (neededBy === undefined) {
    return { error: "Required-by date must be valid" };
  }

  return {
    data: { supplier, description, quantity, unitCost, status, neededBy },
  };
};

const handleWriteError = (error, res) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  console.error("Procurement request operation failed:", error);
  return res.status(500).json({ message: "Unable to save purchase request" });
};

exports.getPurchaseRequests = async (req, res) => {
  try {
    const requests = await PurchaseRequest.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    return res.json(requests);
  } catch (error) {
    console.error("Purchase request list failed:", error);
    return res.status(500).json({ message: "Unable to load purchase requests" });
  }
};

exports.addPurchaseRequest = async (req, res) => {
  const { data, error } = validateRequest(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const request = await PurchaseRequest.create({
      ...data,
      userId: req.user._id,
    });
    return res.status(201).json(request);
  } catch (writeError) {
    return handleWriteError(writeError, res);
  }
};

exports.updatePurchaseRequest = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid purchase request ID" });
  }
  const { data, error } = validateRequest(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const request = await PurchaseRequest.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      data,
      { new: true, runValidators: true }
    );
    if (!request) {
      return res.status(404).json({ message: "Purchase request not found" });
    }
    return res.json(request);
  } catch (writeError) {
    return handleWriteError(writeError, res);
  }
};

exports.deletePurchaseRequest = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid purchase request ID" });
  }

  try {
    const request = await PurchaseRequest.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!request) {
      return res.status(404).json({ message: "Purchase request not found" });
    }
    return res.json({ message: "Purchase request deleted successfully" });
  } catch (error) {
    console.error("Purchase request deletion failed:", error);
    return res.status(500).json({ message: "Unable to delete purchase request" });
  }
};
