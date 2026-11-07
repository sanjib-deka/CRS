const xlsx = require('xlsx');
const { isValidObjectId } = require("mongoose");
const Expense = require("../models/Expense");

// Add Expense
exports.addExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, category, amount, date } = req.body;

    // Validation: Check for missing fields
    const parsedAmount = Number(amount);
    const parsedDate = new Date(date);
    if (
      typeof category !== "string" ||
      !category.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !date ||
      Number.isNaN(parsedDate.getTime())
    ) {
      return res.status(400).json({
        message: "A category, positive amount, and valid date are required",
      });
    }

    const newExpense = new Expense({
      userId,
      icon,
      category: category.trim(),
      amount: parsedAmount,
      date: parsedDate,
    });

    await newExpense.save();
    res.status(200).json(newExpense);
  } catch (error) {
    console.error("Expense creation failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get All Expenses (For Logged-in User)
exports.getAllExpenses = async (req, res) => {
  const userId = req.user.id;

  try {
    const expenses = await Expense.find({ userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error("Expense list failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
  const userId = req.user.id;
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid expense ID" });
  }

  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId,
    });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Expense deletion failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Download Expense Details in Excel
exports.downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id;
  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });

    // Prepare data for Excel
    const data = expense.map((item) => ({
      Category: item.category,
      Amount: item.amount,
      Date: item.date,
    }));
    
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Expense");
    const buffer = xlsx.write(wb, { bookType: "xlsx", type: "buffer" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="expense_details.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error("Expense export failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
