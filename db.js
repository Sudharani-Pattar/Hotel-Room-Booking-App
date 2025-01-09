const mongoose = require("mongoose");

var mongoURL = 'mongodb+srv://sudharanispattar:Sharanappa@cluster0.mvfup.mongodb.net/mern-rooms'

mongoose.connect(mongoURL, {useUnifiedTopology : true, useNewUrlParser: true})

var connection = mongoose.connection

connection.on('error', () => {
    console.log('MongoDB connection error')
})

connection.on('connected', () => {
    console.log('MongoDB connection successful')
})

module.exports = mongoose