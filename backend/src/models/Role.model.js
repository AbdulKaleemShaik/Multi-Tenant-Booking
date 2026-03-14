const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    displayName: {
        type: String,
        required: true
    },
    rank: {
        type: Number,
        required: true,
        unique: true
    },
    description: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
