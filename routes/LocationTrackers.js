// router/location.js
const express = require('express');
const router = express.Router();
const io = require('../webShocket'); // Corrected import path for WebSocket instance
const LocationDetails = require('../model/LocationTracker'); // Corrected import path for Mongoose model
const auth = require("../middleware/auth");

const {driversCollection}=require('../config')

router.post('/location', auth, async (req, res) => {
  try {
    const { currentLocation, currentVelocity, latitude, longitude } = req.body; // Destructure fields from the request body
    //console.log(currentLocation, currentVelocity, latitude, longitude); // Log the received data for debugging
    // Save location data to database
    const locationDetails = new LocationDetails({
      currentLocation,
      currentVelocity,
      latitude,
      longitude
    });
    await locationDetails.save();
    // Broadcast location update to clients
    //io.emit('locationUpdate', { currentLocation, currentVelocity, latitude, longitude });
    res.status(200).send('Location data saved successfully');
  } catch (error) {
    console.error('Error saving location data:', error);
    res.status(500).send('Internal server error');
  }
});
router.get('/get-location', auth, async (req, res) => {
  try {
    // Query the "drivers" collection to get the latest location data
    const querySnapshot = await driversCollection.get();

    // Check if any documents are returned
    if (!querySnapshot.empty) {
      // Extract the latest location data from the document
       const latestLocation = querySnapshot.docs.map(doc => doc.data());
      res.json(latestLocation); // Send the location data back to the client
    } else {
      console.log('No location data found');
      res.status(404).send('No location data found'); // Send 404 status if no data found
    }
  } catch (error) {
    console.error('Error fetching location data:', error);
    res.status(500).send('Internal server error'); // Send 500 status in case of error
  }
});
  
  

module.exports = router;
