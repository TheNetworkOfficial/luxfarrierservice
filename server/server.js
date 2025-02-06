// Server.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

const Appointment = require('./models/Appointment');
const { sendAdminNotification, sendUserConfirmation } = require('./mailer');
const { addToGoogleCalendar } = require('./calendarService');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = 3000;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
console.log('Google API Key:', GOOGLE_API_KEY); // Keep this for debugging

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Geocode Endpoint
app.get("/api/geocode", async (req, res) => {
  const address = req.query.address;
  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }
  try {
    console.log(`Requesting geocode for address: ${address}`); // Log address
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: {
        address,
        key: GOOGLE_API_KEY,
      },
    });
    console.log("Geocode API Response:", response.data); // Log API response
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching geocode data:", error.response?.data || error.message); // Log detailed error
    res.status(500).json({ error: "Failed to fetch geocode data", details: error.response?.data || error.message });
  }
});

// Distance Matrix Endpoint
app.get("/api/distance", async (req, res) => {
  const { origins, destinations } = req.query;
  if (!origins || !destinations) {
    return res.status(400).json({ error: "Origins and destinations are required" });
  }
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
      params: {
        origins,
        destinations,
        key: GOOGLE_API_KEY,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch distance data" });
  }
});

// Autocomplete Endpoint
app.get('/api/autocomplete', async (req, res) => {
  const input = req.query.input;
  if (!input) {
    return res.status(400).json({ error: 'Input parameter is required' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input,
        key: GOOGLE_API_KEY,
        types: 'address',
        components: 'country:us',
      },
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: response.data.status, predictions: response.data.predictions });
    }

    res.json(response.data.predictions);
  } catch (error) {
    console.error('Error in /api/autocomplete:', error.response?.data || error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Place Details Endpoint
app.get('/api/place-details', async (req, res) => {
  const place_id = req.query.place_id;
  if (!place_id) {
    return res.status(400).json({ error: 'place_id parameter is required' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id,
        key: GOOGLE_API_KEY,
        fields: 'address_component,geometry',
      },
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: response.data.status });
    }

    res.json(response.data.result);
  } catch (error) {
    console.error('Error in /api/place-details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Appointment submission endpoint
app.post('/api/appointments', async (req, res) => {
  try {
      const appointment = new Appointment({
          ...req.body,
          selectedSlots: req.body.selectedSlots.map(slot => ({
              date: new Date(slot.date),
              hour: slot.hour
          }))
      });
      
      const savedAppointment = await appointment.save();
      
      // Send notifications
      sendAdminNotification(savedAppointment);
      sendUserConfirmation(savedAppointment);
      
      // Add to Google Calendar (will be added when admin confirms)
      res.status(201).json({ 
          status: 'success',
          data: savedAppointment 
      });
    } catch (error) {
      console.error("Appointment submission error:", error);
      res.status(400).json({
          status: 'fail',
          message: error.message
      });
    }
});

// X-ray upload endpoint
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

app.post('/api/upload-xray', async (req, res) => {
  const file = req.files?.xray;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const key = `xrays/${Date.now()}-${file.name}`;
  
  try {
      await s3.send(new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: file.data,
          ContentType: file.mimetype
      }));
      
      res.json({ 
          url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`
      });
  } catch (error) {
      res.status(500).json({ error: 'File upload failed' });
  }
});

// Import and use calendar routes
const calendarRoutes = require('./routes/calendar');
app.use(calendarRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});