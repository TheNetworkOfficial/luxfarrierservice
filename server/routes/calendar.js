//server/routes/calendar.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Replace the Google Apps Script URL with this endpoint
router.get('/api/calendar/busy-slots', async (req, res) => {
  const { start, end } = req.query;
  
  try {
    const response = await axios.get(
      "https://script.google.com/macros/s/AKfycbz8_ifBwS6la0iwJ7X7nQ6JI3wbFsXzc1KRWhxFNXMwowYF0whF5QvtE6bLRM9QUCFX/exec",
      { params: { start, end } }
    );

    // Return an object with "busy"
    res.json({ busy: response.data.busy });
  } catch (error) {
    console.error('Calendar busy slots error:', error);
    res.status(500).json({ error: 'Failed to fetch busy slots' });
  }
});

module.exports = router;