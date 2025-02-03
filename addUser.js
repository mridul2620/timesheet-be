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

if (!username || !password || !email || !name || !role) {
    console.log('Please provide a username, password, email, name, and role');
    process.exit(1);
}

const addUser = async () => {
    try {
        const user = new User({ username, email, name, role, payrate, designation });
        await User.register(user, password);
        console.log(`User ${username} added successfully`);
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

addUser();
