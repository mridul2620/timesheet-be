const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { 
        type: [String], 
        unique: true, 
        required: true 
    },
    name: { type: String, required: true },
    designation: { type: String },
    role: { type: String, enum: ['user', 'admin'], required: true },
    payrate: { type: mongoose.Types.Decimal128 },
    active: { type: Boolean, default: true },
    
    // Change allocatedHours to an array
    allocatedHours: [{ 
        year: { type: String, required: true },
        hours: { type: String, required: true }
    }],

    // New financial years array
    financialYears: [{ 
        year: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    }],
    
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

// Ensure payrate is serialized as a string
UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.payrate = ret.payrate ? ret.payrate.toString() : ret.payrate;
        return ret;
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);