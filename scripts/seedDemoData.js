require("dotenv").config();

const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const mongoose = require("mongoose");
const User = require("../models/User");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const FleetVehicle = require("../models/FleetVehicle");
const Employee = require("../models/Employee");
const PurchaseRequest = require("../models/PurchaseRequest");

const utcDate = (date) => new Date(`${date}T00:00:00.000Z`);

const seedGroups = [
  {
    Model: Income,
    collection: "incomes",
    identity: ["source", "date"],
    records: [
      ["Consulting project", 48500, "2026-10-10"],
      ["Service contract", 62000, "2026-08-10"],
      ["Training session", 28750, "2026-06-10"],
      ["Implementation milestone", 73500, "2026-04-10"],
      ["Support retainer", 36500, "2026-02-10"],
      ["Workshop delivery", 42000, "2025-12-10"],
    ].map(([source, amount, date]) => ({
      source: `DEMO • ${source}`,
      amount,
      date: utcDate(date),
      icon: "",
    })),
  },
  {
    Model: Expense,
    collection: "expenses",
    identity: ["category", "date"],
    records: [
      ["Office supplies", 8250, "2026-11-10"],
      ["Software subscriptions", 12900, "2026-10-10"],
      ["Travel and transport", 6800, "2026-09-10"],
      ["Utilities", 9400, "2026-08-10"],
      ["Marketing campaign", 15750, "2026-07-10"],
      ["Equipment", 22400, "2026-06-10"],
      ["Team training", 5600, "2026-11-10"],
      ["Internet and communications", 3900, "2026-10-10"],
      ["Workspace services", 18000, "2026-09-10"],
      ["Maintenance", 7200, "2026-08-10"],
    ].map(([category, amount, date]) => ({
      category: `DEMO • ${category}`,
      amount,
      date: utcDate(date),
      icon: "",
    })),
  },
  {
    Model: FleetVehicle,
    collection: "fleetvehicles",
    identity: ["registrationNumber"],
    records: [
      ["Car", 4, "Available"],
      ["Van", 8, "Available"],
      ["Bus", 32, "In Service"],
      ["Truck", 12, "Available"],
      ["Car", 5, "Maintenance"],
      ["Van", 10, "Available"],
      ["Bus", 24, "In Service"],
      ["Other", 2, "Available"],
    ].map(([vehicleType, capacity, status], index) => ({
      registrationNumber: `DEMO-ERP-${String(index + 1).padStart(3, "0")}`,
      vehicleType,
      capacity,
      status,
      insuranceExpiry: utcDate("2027-05-10"),
      registrationExpiry: utcDate("2027-11-10"),
    })),
  },
  {
    Model: Employee,
    collection: "employees",
    identity: ["employeeCode"],
    records: [
      ["Aarav Mehta", "Finance Analyst", "Finance", "Active"],
      ["Ananya Rao", "HR Coordinator", "HR", "Active"],
      ["Ishaan Kapoor", "Operations Manager", "Operations", "Active"],
      ["Mira Shah", "Procurement Specialist", "Procurement", "Active"],
      ["Kabir Nair", "Fleet Coordinator", "Operations", "On Leave"],
      ["Diya Sen", "Accountant", "Finance", "Active"],
      ["Arjun Das", "People Partner", "HR", "Active"],
      ["Tara Iyer", "Business Analyst", "Operations", "Inactive"],
      ["Neel Verma", "Office Administrator", "Administration", "Active"],
    ].map(([fullName, jobTitle, department, status], index) => ({
      employeeCode: `DEMO-ERP-${String(index + 1).padStart(3, "0")}`,
      fullName: `Demo ${fullName}`,
      workEmail: `demo.employee${String(index + 1).padStart(2, "0")}@example.com`,
      jobTitle,
      department,
      status,
    })),
  },
  {
    Model: PurchaseRequest,
    collection: "purchaserequests",
    identity: ["supplier", "description"],
    records: [
      ["Northstar Office Supply", "Office supply restock", 25, 680, "Requested", "2026-12-22"],
      ["Meridian Business Systems", "Laptop docking stations", 12, 2450, "Draft", "2026-11-22"],
      ["Cityline Equipment Co.", "Fleet safety kits", 8, 1750, "Requested", "2026-10-22"],
      ["Clearview Software", "Accounting software renewal", 1, 28500, "Draft", "2026-09-22"],
      ["Summit Workspace", "Ergonomic desk chairs", 6, 8900, "Requested", "2026-12-22"],
      ["Reliable Network Services", "Network equipment", 4, 12600, "Draft", "2026-11-22"],
      ["Metro Fleet Parts", "Vehicle service parts", 14, 2350, "Requested", "2026-10-22"],
      ["Brightside Stationery", "Printer and paper supplies", 30, 420, "Draft", "2026-09-22"],
      ["Pioneer Safety Supply", "Protective workwear", 18, 1450, "Requested", "2026-12-22"],
      ["Urban Facilities Group", "Facilities maintenance materials", 10, 3100, "Draft", "2026-11-22"],
    ].map(([supplier, description, quantity, unitCost, status, neededBy]) => ({
      supplier: `DEMO • ${supplier}`,
      description: `DEMO • ${description}`,
      quantity,
      unitCost,
      status,
      neededBy: utcDate(neededBy),
    })),
  },
];

const sameValue = (left, right) => {
  if (left instanceof Date || right instanceof Date) {
    return new Date(left).getTime() === new Date(right).getTime();
  }
  return left === right;
};

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const accountCount = await User.countDocuments();
  const targetEmail = process.env.SEED_USER_EMAIL?.trim().toLowerCase();

  let user;
  if (targetEmail) {
    user = await User.findOne({ email: targetEmail }).select("_id fullName");
    if (!user) {
      throw new Error("SEED_USER_EMAIL does not match an existing account");
    }
  } else if (accountCount === 1) {
    user = await User.findOne().select("_id fullName");
  } else {
    throw new Error(
      "Set SEED_USER_EMAIL to select an existing account when the database has zero or multiple users"
    );
  }

  const plans = [];
  for (const group of seedGroups) {
    const plan = {
      Model: group.Model,
      collection: group.collection,
      records: group.records,
      existing: 0,
      insert: [],
      conflicts: [],
    };

    for (const record of group.records) {
      const identity = Object.fromEntries(
        group.identity.map((key) => [key, record[key]])
      );
      const existing = await group.Model.findOne({
        userId: user._id,
        ...identity,
      }).lean();

      if (!existing) {
        plan.insert.push(record);
        continue;
      }

      const hasSameSeedData = Object.entries(record).every(([key, value]) =>
        sameValue(existing[key], value)
      );
      if (hasSameSeedData) {
        plan.existing += 1;
      } else {
        plan.conflicts.push(identity);
      }
    }

    plans.push(plan);
  }

  const collections = {};
  for (const plan of plans) {
    collections[plan.collection] = {
      currentAccountRecords: await plan.Model.countDocuments({
        userId: user._id,
      }),
      alreadySeeded: plan.existing,
      wouldInsert: plan.insert.length,
      conflicts: plan.conflicts.length,
    };
  }

  console.log(
    JSON.stringify(
      {
        mode: process.argv.includes("--apply") ? "apply requested" : "dry run",
        database: db.databaseName,
        account: user.fullName,
        collections,
      },
      null,
      2
    )
  );

  const conflicts = plans.flatMap((plan) =>
    plan.conflicts.map((identity) => ({
      collection: plan.collection,
      identity,
    }))
  );
  if (conflicts.length > 0) {
    throw new Error(
      `Existing records conflict with seed identities; no records were changed: ${JSON.stringify(conflicts)}`
    );
  }

  const additions = plans.reduce((sum, plan) => sum + plan.insert.length, 0);
  if (!process.argv.includes("--apply")) {
    console.log("Dry run only. No database records were written.");
    return;
  }
  if (additions === 0) {
    console.log("All seed records already exist. No database writes were needed.");
    return;
  }

  const prompt = readline.createInterface({ input: stdin, output: stdout });
  let confirmation;
  try {
    confirmation = await prompt.question(
      `This will only insert ${additions} missing records into ${db.databaseName} (${plans
        .filter((plan) => plan.insert.length > 0)
        .map((plan) => plan.collection)
        .join(", ")}). Type the database name to continue: `
    );
  } finally {
    prompt.close();
  }

  if (confirmation !== db.databaseName) {
    console.log("Confirmation did not match. No database records were written.");
    return;
  }

  for (const plan of plans) {
    for (const record of plan.insert) {
      await plan.Model.create({ ...record, userId: user._id });
    }
  }

  const verification = {};
  for (const plan of plans) {
    verification[plan.collection] = {
      expectedSeedRecords: plan.records.length,
      foundSeedRecords: await Promise.all(
        plan.records.map(async (record) => {
          const identity = Object.fromEntries(
            seedGroups
              .find((group) => group.collection === plan.collection)
              .identity.map((key) => [key, record[key]])
          );
          return plan.Model.exists({ userId: user._id, ...identity });
        })
      ).then((records) => records.filter(Boolean).length),
    };
  }

  console.log(JSON.stringify({ verification }, null, 2));
  if (
    Object.values(verification).some(
      ({ expectedSeedRecords, foundSeedRecords }) =>
        expectedSeedRecords !== foundSeedRecords
    )
  ) {
    throw new Error("Post-seed verification failed");
  }
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
