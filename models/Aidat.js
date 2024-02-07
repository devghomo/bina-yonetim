const mongoose = require('mongoose');

const aidatSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    month: {
        type: String,
        required: true
    },
    details: [
        {
            type: Array,
            required: true,
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }]
});

const Aidat = mongoose.model('Aidat', aidatSchema);

module.exports = Aidat;