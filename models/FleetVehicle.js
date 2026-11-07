const mongoose = require("mongoose");

const FleetVehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registrationNumber: { type: String, required: true, trim: true },
    vehicleType: {
      type: String,
      required: true,
      enum: ["Car", "Van", "Bus", "Truck", "Other"],
    },
    capacity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    status: {
      type: String,
      required: true,
      enum: ["Available", "In Service", "Maintenance"],
      default: "Available",
    },
    insuranceExpiry: { type: Date, default: null },
    registrationExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

FleetVehicleSchema.index(
  { userId: 1, registrationNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("FleetVehicle", FleetVehicleSchema);
