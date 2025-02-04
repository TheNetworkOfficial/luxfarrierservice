// server/models/Appointment.js
const mongoose = require('mongoose');

const horseSchema = new mongoose.Schema({
  name: String,
  occupation: String,
  lastCare: Date,
  laminitisHistory: String,
  specialNeeds: String,
  xrayUrl: String, // For AWS S3 links
});

const appointmentSchema = new mongoose.Schema({
  client: {
    firstName: String,
    lastName: String,
    address: String,
    phone: String,
    email: String,
  },
  horses: [horseSchema],
  selectedSlots: [{
    date: Date,
    hour: Number,
  }],
  status: {
    type: String,
    default: 'pending',
  },
  chosenSlot: {
    date: Date,
    hour: Number,
  },
});

module.exports = mongoose.model('Appointment', appointmentSchema);