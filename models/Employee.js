const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeCode: { type: String, required: true, trim: true, maxlength: 32 },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    workEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
    },
    jobTitle: { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, required: true, trim: true, maxlength: 100 },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive"],
      default: "Active",
      required: true,
    },
  },
  { timestamps: true }
);

EmployeeSchema.index({ userId: 1, employeeCode: 1 }, { unique: true });
EmployeeSchema.index({ userId: 1, workEmail: 1 }, { unique: true });

module.exports = mongoose.model("Employee", EmployeeSchema);
