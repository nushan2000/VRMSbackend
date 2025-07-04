// Import necessary modules and models
const express = require("express");
const Request = require("../model/Request.js");
const Vehicle = require("../model/Vehicle.js");
const auth = require("../middleware/auth");

// Create an Express router
const router = express.Router();

router.get("/getAvailableSeats", async (req, res) => {
  try {
    const { date, vehicle } = req.query;

    console.log("Received request to fetch available seats.");
    console.log("Request parameters - Date:", date, ", Vehicle:", vehicle);

    if (!date || !vehicle) {
      console.error("Date and vehicle parameters are required.");
      return res
        .status(400)
        .json({ message: "Date and vehicle parameters are required." });
    }

    console.log("Parameters validation successful.");

    const { parse, format } = require("date-fns");

    const selectedDate = format(
      parse(date, "yyyy-MM-d", new Date()),
      "yyyy-MM-dd"
    );
    console.log("Formatted Date:", selectedDate);

    // const finalDate = new Date(`${selectedDate}T00:00:00.000Z`);
    // console.log("Date string converted to JavaScript Date object:", finalDate);

    console.log(
      "Date string converted to JavaScript Date object:",
      selectedDate
    );

    const requests = await Request.find({ date: selectedDate, vehicle });

    console.log(
      "Retrieved requests for the specified date and vehicle:",
      requests
    );

    let totalPassengers = 0;

    requests.forEach((request) => {
      console.log("Passengers:", request.passengers);
      totalPassengers += request.passengers.filter(
        (passenger) =>
          passenger.name ||
          passenger.position ||
          passenger.pickup ||
          passenger.drop
      ).length;
    });
    console.log("Total number of passengers calculated:", totalPassengers);

    const vehicleInfo = await Vehicle.findOne({ _id: vehicle });

    if (!vehicleInfo) {
      console.error("Vehicle not found.");
      return res.status(404).json({ message: "Vehicle not found." });
    }

    console.log("Vehicle found in the database.");

    const availableSeats = vehicleInfo.sheatCapacity - totalPassengers;

    console.log("Available seats calculated:", availableSeats);

    res.json({ vehicle, date, availableSeats });
  } catch (error) {
    console.error("Error calculating available seats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Export the router
module.exports = router;
