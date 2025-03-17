const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    assignedTo: { 
        type: [String], 
        default: [] 
    }
}, { collection: 'subjects' });


module.exports = mongoose.model('Subject', subjectSchema);