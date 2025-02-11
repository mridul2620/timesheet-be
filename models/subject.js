const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
}, { collection: 'subjects' });


module.exports = mongoose.model('Subject', subjectSchema);