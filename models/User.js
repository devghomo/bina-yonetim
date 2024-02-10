// models/User.js

const mongoose = require('mongoose');

// Kullanıcı şeması
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

// Kullanıcı modeli
const User = mongoose.model('User', userSchema);

module.exports = User;
