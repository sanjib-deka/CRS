const mongoose = require("mongoose");

const PurchaseRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supplier: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 240 },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    unitCost: { type: Number, required: true, min: 0.01 },
    status: {
      type: String,
      enum: ["Draft", "Requested", "Approved", "Received", "Cancelled"],
      default: "Draft",
      required: true,
    },
    neededBy: { type: Date, default: null },
  },
  { timestamps: true }
);

PurchaseRequestSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("PurchaseRequest", PurchaseRequestSchema);
