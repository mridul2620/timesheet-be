const fs = require('fs');
const path = require('path');

// 1. Fix addTimesheet.js
const addTsPath = path.join(__dirname, 'routes', 'Timesheet', 'addTimesheet.js');
let addTsContent = fs.readFileSync(addTsPath, 'utf8');

if (!addTsContent.includes("const { authenticateToken }")) {
  addTsContent = addTsContent.replace('const router = express.Router();', 'const router = express.Router();\nconst { authenticateToken } = require("../../middleware/auth");');
  addTsContent = addTsContent.replace('router.post("/api/timesheet/submit", async (req, res) => {', 'router.post("/api/timesheet/submit", authenticateToken, async (req, res) => {');
  addTsContent = addTsContent.replace('router.put("/api/timesheet/update/:id", async (req, res) => {', 'router.put("/api/timesheet/update/:id", authenticateToken, async (req, res) => {');
}

// Add IDOR to submit
if (!addTsContent.includes("Forbidden: You can only submit your own timesheet")) {
  addTsContent = addTsContent.replace(
    'const { username, weekStartDate, entries, workDescription, dayStatus } = req.body;',
    'const { username, weekStartDate, entries, workDescription, dayStatus } = req.body;\n\n        if (req.user.username !== username && req.user.role !== "admin") {\n            return res.status(403).json({ message: "Forbidden: You can only submit your own timesheet" });\n        }'
  );
}

// Add IDOR to update
addTsContent = addTsContent.replace(
  /if \(timesheet\.username !== username\) \{[\s\S]*?message: "You are not authorized to update this timesheet"[\s\S]*?\}\n        \}/,
  'if (timesheet.username !== req.user.username && req.user.role !== "admin") {\n            return res.status(403).json({\n                success: false,\n                message: "You are not authorized to update this timesheet"\n            });\n        }'
);
fs.writeFileSync(addTsPath, addTsContent);

// 2. Fix deleteTimesheet.js
const delTsPath = path.join(__dirname, 'routes', 'Timesheet', 'deleteTimesheet.js');
let delTsContent = fs.readFileSync(delTsPath, 'utf8');
if (!delTsContent.includes('Forbidden:')) {
  delTsContent = delTsContent.replace(
    'const { username } = req.params;',
    'const { username } = req.params;\n      if (req.user.username !== username && req.user.role !== "admin") {\n          return res.status(403).json({ message: "Forbidden: Cannot delete others timesheets" });\n      }'
  );
  fs.writeFileSync(delTsPath, delTsContent);
}

// 3. Fix payroll.js
const payrollPath = path.join(__dirname, 'routes', 'payroll.js');
let payrollContent = fs.readFileSync(payrollPath, 'utf8');
if (!payrollContent.includes('Forbidden: Cannot modify payroll')) {
  payrollContent = payrollContent.replace(
    /const \{ username, name, timePeriod[\s\S]*?\} = req\.body;/,
    `const { username, name, timePeriod, payrate, netPay, totalTime, workingDays, status = 'Paid' } = req.body;\n\n    if (req.user.username !== username && req.user.role !== 'admin') {\n      return res.status(403).json({ success: false, message: 'Forbidden: Cannot modify payroll for others' });\n    }`
  );
  payrollContent = payrollContent.replace(
    /const \{ username, recordId \} = req\.params;/,
    `const { username, recordId } = req.params;\n    if (req.user.username !== username && req.user.role !== 'admin') {\n      return res.status(403).json({ success: false, message: 'Forbidden: Cannot modify payroll for others' });\n    }`
  );
  payrollContent = payrollContent.replace(
    /const \{ username \} = req\.params;/,
    `const { username } = req.params;\n    if (req.user.username !== username && req.user.role !== 'admin') {\n      return res.status(403).json({ success: false, message: 'Forbidden: Cannot view payroll for others' });\n    }`
  );
  fs.writeFileSync(payrollPath, payrollContent);
}

// 4. Fix editUser.js
const editUserPath = path.join(__dirname, 'routes', 'User', 'editUser.js');
let editUserContent = fs.readFileSync(editUserPath, 'utf8');
if (!editUserContent.includes('Forbidden: Cannot edit other users')) {
  editUserContent = editUserContent.replace(
    'const { username,',
    'if (req.user.username !== req.body.username && req.user.role !== "admin") {\n        return res.status(403).json({ success: false, message: "Forbidden: Cannot edit other users" });\n    }\n\n    const { username,'
  );
  fs.writeFileSync(editUserPath, editUserContent);
}

console.log("IDOR patched.");
