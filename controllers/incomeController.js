const xlsx = require('xlsx');
const { isValidObjectId } = require("mongoose");
const Income = require("../models/Income");

// Add Income
exports.addIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, source, amount, date } = req.body;

    // Validation: Check for missing fields
    const parsedAmount = Number(amount);
    const parsedDate = new Date(date);
    if (
      typeof source !== "string" ||
      !source.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !date ||
      Number.isNaN(parsedDate.getTime())
    ) {
      return res.status(400).json({
        message: "A source, positive amount, and valid date are required",
      });
    }

    const newIncome = new Income({ 
      userId, 
      icon, 
      source: source.trim(),
      amount: parsedAmount,
      date: parsedDate
    });

    await newIncome.save();
    res.status(200).json(newIncome);
  } catch (error) {
    console.error("Income creation failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get All Income (For Logged-in User)
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const income = await Income.find({ userId }).sort({ date: -1 });
    res.json(income);
  } catch (error) {
    console.error("Income list failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete Income
exports.deleteIncome = async (req, res) => {
  const userId = req.user.id;
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid income ID" });
  }

  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      userId,
    });
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }
    res.json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Income deletion failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Download Income Details in Excel
exports.downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id;
  try {
    const income = await Income.find({ userId }).sort({ date: -1 });

    // Prepare data for Excel
    const data = income.map((item) => ({
      Source: item.source,
      Amount: item.amount,
      Date: item.date,
    }));
    
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Income");
    const buffer = xlsx.write(wb, { bookType: "xlsx", type: "buffer" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="income_details.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error("Income export failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
