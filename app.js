require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const cors = require('cors');
const User = require('./models/user');

// Route imports - User
const loginRoutes = require('./routes/User/login');
const registerRoutes = require('./routes/User/register');
const userRoutes = require('./routes/User/users');
const deleteUserRoutes = require('./routes/User/deleteUser');
const editUserRoutes = require('./routes/User/editUser');

// Route imports - Password
const forgotPasswordRoutes = require('./routes/Password/forgot');
const resetPasswordRoutes = require('./routes/Password/reset');
const changePasswordRoutes = require('./routes/Password/changepassword');

// Route imports - Client
const clientRoutes = require('./routes/client/addClient');
const getclients = require('./routes/client/getClient');
const updateClients = require('./routes/client/updateClient');
const deleteClients = require('./routes/client/deleteClient');

// Route imports - Subject
const subjectRoutes = require('./routes/Subject/addSubject');
const getSubjects = require('./routes/Subject/getSubject');
const updateSubjects = require('./routes/Subject/updateSubject');
const deleteSubjects = require('./routes/Subject/deleteSubjects');

// Route imports - Project
const projectRoutes = require('./routes/Project/addProject');
const getProjects = require('./routes/Project/getProject');
const updateProjects = require('./routes/Project/updateProject');
const deleteProjects = require('./routes/Project/deleteProjects');

// Route imports - Timesheet
const addTimesheet = require('./routes/Timesheet/addTimesheet');
const getTimesheet = require('./routes/Timesheet/getTimesheet');
const deleteTimesheet = require('./routes/Timesheet/deleteTimesheet');
const draftTimesheet = require('./routes/Draft Timesheet/draft');

// Route imports - Holiday
const addHoliday = require('./routes/Holiday/addHoliday');
const updateHoliday = require('./routes/Holiday/updateHoliday');
const deleteHoliday = require('./routes/Holiday/deleteHoliday');
const getHoliday = require('./routes/Holiday/getHoliday');

// Route imports - Mail
const mail = require('./routes/Mail/mail');
const holidayMail = require('./routes/Mail/holidayMail');
const approvalMail = require('./routes/Mail/approvalMail');

// Route imports - Payroll
const payroll = require('./routes/payroll');

// Initialize Express
const app = express();


const validateEnv = () => {
    const required = ['MONGODB_URI', 'SESSION_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('=== MISSING ENVIRONMENT VARIABLES ===');
        missing.forEach(key => console.error(`  - ${key}`));
        console.error('\nPlease check your .env file');
        process.exit(1);
    }

    console.log('✓ Environment variables validated');
};

const connectDB = async () => {
    try {
        // Set up connection event listeners before connecting
        mongoose.connection.on('connected', () => {
            console.log('✓ MongoDB connected successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error('✗ MongoDB connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('✗ MongoDB disconnected');
        });

        // Graceful shutdown handling
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });

        // Connect with options
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        return true;
    } catch (error) {
        console.error('=== MONGODB CONNECTION FAILED ===');
        console.error('Error:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.error('\nPossible causes:');
            console.error('  - MongoDB server is not running');
            console.error('  - Wrong host/port in connection string');
        } else if (error.message.includes('authentication failed')) {
            console.error('\nPossible causes:');
            console.error('  - Wrong username or password');
            console.error('  - User does not have access to the database');
        } else if (error.message.includes('getaddrinfo')) {
            console.error('\nPossible causes:');
            console.error('  - Invalid hostname in connection string');
            console.error('  - Network connectivity issues');
        } else if (error.message.includes('querySrv')) {
            console.error('\nPossible causes:');
            console.error('  - Invalid MongoDB Atlas connection string');
            console.error('  - DNS resolution failed');
        }

        return false;
    }
};

const configureMiddleware = () => {
    // View engine
    app.set('view engine', 'ejs');

    // CORS
    const corsOptions = {
        origin: process.env.CORS_ORIGIN || '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
        credentials: true
    };
    app.use(cors(corsOptions));

    // Body parser
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Session
    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }));

    // Flash messages
    app.use(flash());

    // Passport
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    // Local variables middleware
    app.use((req, res, next) => {
        res.locals.currentUser = req.user;
        res.locals.error = req.flash('error');
        res.locals.success = req.flash('success');
        next();
    });

    // Request logging (development)
    if (process.env.NODE_ENV !== 'production') {
        app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
            next();
        });
    }

    console.log('✓ Middleware configured');
};

const configureRoutes = () => {
    // Health check endpoint
    app.get('/health', async (req, res) => {
        const dbStates = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbStates[mongoose.connection.readyState] || 'unknown',
            uptime: process.uptime()
        });
    });

    // API Routes - User Management
    app.use(loginRoutes);
    app.use(registerRoutes);
    app.use(userRoutes);
    app.use(deleteUserRoutes);
    app.use(editUserRoutes);

    // API Routes - Password Management
    app.use(forgotPasswordRoutes);
    app.use(resetPasswordRoutes);
    app.use(changePasswordRoutes);

    // API Routes - Client Management
    app.use(clientRoutes);
    app.use(getclients);
    app.use(updateClients);
    app.use(deleteClients);

    // API Routes - Subject Management
    app.use(subjectRoutes);
    app.use(getSubjects);
    app.use(updateSubjects);
    app.use(deleteSubjects);

    // API Routes - Project Management
    app.use(projectRoutes);
    app.use(getProjects);
    app.use(updateProjects);
    app.use(deleteProjects);

    // API Routes - Timesheet Management
    app.use(addTimesheet);
    app.use(getTimesheet);
    app.use(deleteTimesheet);
    app.use(draftTimesheet);

    // API Routes - Holiday Management
    app.use(addHoliday);
    app.use(updateHoliday);
    app.use(deleteHoliday);
    app.use(getHoliday);

    app.use(mail);
    app.use(holidayMail);
    app.use(approvalMail);

    app.use(payroll);

    console.log('✓ Routes configured');
};

const configureErrorHandlers = () => {
    // 404 Handler
    app.use((req, res, next) => {
        res.status(404).json({
            success: false,
            message: 'Route not found',
            path: req.originalUrl
        });
    });

    app.use((err, req, res, next) => {
        console.error('=== ERROR ===');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Route:', req.method, req.originalUrl);
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: messages
            });
        }

        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `Duplicate value for field: ${field}`
            });
        }

        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: `Invalid ${err.path}: ${err.value}`
            });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        // Default error response
        const statusCode = err.status || err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    });

    console.log('✓ Error handlers configured');
};

const startServer = async () => {

    validateEnv();

    const dbConnected = await connectDB();
    if (!dbConnected) {
        console.error('\n✗ Server startup aborted due to database connection failure');
        process.exit(1);
    }

    configureMiddleware();

    configureRoutes();

    configureErrorHandlers();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✓ Health check: http://localhost:${PORT}/health`);
        console.log('');
    });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the server
startServer();

module.exports = app;