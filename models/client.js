const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    assignedTo: { 
        type: [String], 
        default: [] 
    }
});

module.exports = mongoose.model('Client', clientSchema);