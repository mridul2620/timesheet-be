const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

const username = process.argv[2];
const password = process.argv[3];
const email = process.argv[4];
const name = process.argv[5];
const role = process.argv[6];
const payrate = process.argv[7];
const designation = process.argv[8] || '';
const allocatedHours = process.argv[9] || '';
const currentYear = new Date().getFullYear().toString();
const previousYear = (parseInt(currentYear) - 1).toString();

// Function to determine the current financial year
const getCurrentFinancialYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // If we're before April (month 3), we're in the previous year's financial year
  if (currentMonth < 3) {
    return (currentYear - 1).toString();
  } else {
    return currentYear.toString();
  }
};

const financialYear = getCurrentFinancialYear();

if (!username || !password || !email || !name || !role) {
    console.log('Please provide a username, password, email, name, and role');
    process.exit(1);
}

const addUser = async () => {
    try {
        // Create allocatedHours entries for both current and previous financial years
        const hoursEntries = [
            {
                year: financialYear,
                hours: allocatedHours
            }
        ];
        
        // Add previous year if hours were provided
        if (allocatedHours) {
            hoursEntries.push({
                year: previousYear,
                hours: allocatedHours  // We can use the same value or adjust as needed
            });
        }
        
        // Create financial years entries
        const financialYearsEntries = [
            {
                year: financialYear,
                startDate: new Date(`${financialYear}-04-01`),
                endDate: new Date(`${parseInt(financialYear) + 1}-03-31`)
            },
            {
                year: previousYear,
                startDate: new Date(`${previousYear}-04-01`),
                endDate: new Date(`${parseInt(previousYear) + 1}-03-31`)
            }
        ];

        const user = new User({ 
            username, 
            email: [email], 
            name, 
            role, 
            payrate, 
            designation,
            allocatedHours: hoursEntries,
            financialYears: financialYearsEntries
        });
        
        await User.register(user, password);
        console.log(`User ${username} added successfully`);
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

addUser();