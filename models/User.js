
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    block: String,
    doorNumber: String,
    apartmentSize: {
        type: String,
        default: "4+1"
    },
    password: String,
    isAdmin: Number
});

const User = mongoose.model('User', userSchema);

module.exports = User;
