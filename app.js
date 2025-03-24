require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const User = require('./models/user');
const loginRoutes = require('./routes/User/login');
const registerRoutes = require('./routes/User/register');
const userRoutes = require('./routes/User/users');
const deleteUserRoutes = require('./routes/User/deleteUser');
const forgotPasswordRoutes = require('./routes/Password/forgot');
const resetPasswordRoutes = require('./routes/Password/reset'); 
const changePasswordRoutes = require('./routes/Password/changepassword');
const editUserRoutes = require('./routes/User/editUser');
const subjectRoutes = require('./routes/Subject/addSubject');
const projectRoutes = require('./routes/Project/addProject');
const getSubjects = require('./routes/Subject/getSubject');
const getProjects = require('./routes/Project/getProject');
const updateProjects=require('./routes/Project/updateProject');
const deleteSubjects = require('./routes/Subject/deleteSubjects');
const updateSubjects=require('./routes/Subject/updateSubject');
const deleteProjects = require('./routes/Project/deleteProjects');
const addTimesheet = require('./routes/Timesheet/addTimesheet');
const getTimesheet = require('./routes/Timesheet/getTimesheet');
const deleteTimesheet = require('./routes/Timesheet/deleteTimesheet');
const payroll = require('./routes/payroll');
const mail = require('./routes/Mail/mail');
var cors = require('cors');


const app = express();

mongoose.connect(process.env.MONGODB_URI)

mongoose.connection.on('error', err => {
    console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

app.set('view engine', 'ejs');

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
};

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

app.use(loginRoutes);
app.use(registerRoutes);
app.use(userRoutes);
app.use(deleteUserRoutes);
app.use(forgotPasswordRoutes);
app.use(resetPasswordRoutes);
app.use(changePasswordRoutes);
app.use(editUserRoutes);
app.use(subjectRoutes);
app.use(projectRoutes);
app.use(getSubjects);
app.use(getProjects);
app.use(deleteSubjects);
app.use(deleteProjects);
app.use(updateProjects);
app.use(updateSubjects);
app.use(addTimesheet);
app.use(getTimesheet);
app.use(deleteTimesheet);
app.use(payroll);
app.use(mail);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});