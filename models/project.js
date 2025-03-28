const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    assignedTo: { 
        type: [String], 
        default: [] 
    }
});

module.exports = mongoose.model('Project', projectSchema);