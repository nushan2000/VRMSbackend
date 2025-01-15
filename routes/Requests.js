const router = require("express").Router();
const admin = require('firebase-admin');
const Request = require("../model/Request");
const Vehicle = require("../model/Vehicle");
const { requestCollection } = require('../config');
const auth = require("../middleware/auth");
const { requestApprovedEmail } = require('../utills/emailTemplate');
const EmailService = require("../Services/email-service");

const emailService = new EmailService();
// Add a new request
router.post("/addrequest", auth, async (req, res) => {
    try {
        const {
            date,
            startTime,
            endTime,
            reason,
            vehicle,
            section,
            depatureLocation,
            destination,
            comeBack,
            distance,
            passengers,
            applier,
            applyDate,
        } = req.body;

        // Validate passengers array
        if (!Array.isArray(passengers) || passengers.length === 0) {
            throw new Error('Passengers data is missing or invalid');
        }

        // Create the MongoDB document
        const newRequest = new Request({
            date,
            startTime,
            endTime,
            reason,
            vehicle,
            section,
            depatureLocation,
            destination,
            comeBack,
            distance,
            passengers,
            approveHead,
            approveDeenAr,
            applier: req.user.userId,
            applyDate,
            driverStatus: "notStart"
        });

        // Save the request to MongoDB
        const savedRequest = await newRequest.save();

        // Use the MongoDB ID as the Firestore document ID
        // const firestoreDocId = savedRequest._id.toString();
        // const firestoreDocRef = requestCollection.doc(firestoreDocId);

        // Save request data to Firestore
        // await firestoreDocRef.set({
        //     id: firestoreDocId,
        //     date,
        //     startTime,
        //     endTime,
        //     reason,
        //     section,
        //     vehicle,
        //     departureLocation,
        //     destination,
        //     comeBack,
        //     distance,
        //     passengers,
        //     approveHead: false,
        //     approveDeenAr: false,
        //     applier,
        //     applyDate,
        //     driverStatus: "notStart"
        // });



        // Respond with success message and new request object
        res.json({ status: "ok", newRequest: savedRequest });
    } catch (err) {
        console.error("Error occurred: ", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all requests
router.get("/requests", auth, async (req, res) => {
    try {
        const requests = await Request.find();
        res.json(requests);
    } catch (err) {
        console.error("Error fetching requests: ", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get a single request by ID
router.get("/viewRequest/:id", auth, async (req, res) => {
    const requestId = req.params.id;

    try {
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        res.json(request);
    } catch (err) {
        console.error("Error fetching request: ", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
//get vehicles according to date
router.get("/RequestVehicles/:date", async (req, res) => {
    const requestDate = req.params.date;

    try {
       
        const requests = await Request.find({ date: requestDate, approveDeenAr: true });
        const allVehicles = await Vehicle.find();
        // if (!requests || requests.length === 0) {
        //     return res.json(allVehicles);

        // }

       
        const groupedData = requests.reduce((acc, request) => {
            const vehicleName = request.vehicle;
            const passengerCount = request.passengers.length;
            

            if (!acc[vehicleName]) {
                acc[vehicleName] = {
                    vehicleName,
                    totalPassengers: 0,
                    
                };
            }
            acc[vehicleName].totalPassengers += passengerCount;
            return acc;
        }, {});


        
        const groupedArray = Object.values(groupedData);
        console.log(groupedArray);
       
        const vehicleNames = groupedArray.map(v => v.vehicleName);
        console.log(vehicleNames);

        const vehicles = await Vehicle.find({ vehicleName: { $in: vehicleNames } });
        //console.log(vehicles);

       
        const finalDat = groupedArray.map(group => {
            const vehicle = vehicles.find(v => v.vehicleName === group.vehicleName);
            return {
                vehicleName: group.vehicleName,
                totalPassengers: group.totalPassengers,
                maxCapacity: vehicle ? vehicle.sheatCapacity : "Unknown", // Use sheatCapacity from Vehicle
                availableSeats: vehicle
                    ? vehicle.sheatCapacity - group.totalPassengers
                    : "Unknown", // Calculate available seats
                status: vehicle ? vehicle.status : "Unknown", // Include vehicle status
                availability: vehicle ? vehicle.availability : "Unknown", // Include availability
            };
        });
        const finalData = allVehicles.map(vehicle => {
            // Find the matching grouped data for this vehicle
            const grouped = groupedArray.find(g => g.vehicleName === vehicle.vehicleName);

            return {
                vehicleName: vehicle.vehicleName,
                totalPassengers: grouped ? grouped.totalPassengers : 0,
                maxCapacity: vehicle.sheatCapacity, // Use sheatCapacity from Vehicle
                availableSeats: vehicle.sheatCapacity - (grouped ? grouped.totalPassengers : 0),
                status: vehicle.status, // Include vehicle status
                availability: vehicle.availability, // Include availability
            };
        });

        res.json(finalData);
    } catch (err) {
        console.error("Error fetching requests: ", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Update a request by ID
router.put("/updateRequest1/:id", auth, async (req, res) => {
  const requestId = req.params.id;
  const requestData = req.body;

  try {
    console.log(`Updating request with ID: ${requestId}`);

    // Validate passengers array
    if (
      !Array.isArray(requestData.passengers) ||
      requestData.passengers.length === 0
    ) {
      throw new Error("Passengers data is missing or invalid");
    }

    // Find and update the request in MongoDB
    const existingRequest = await Request.findByIdAndUpdate(
      requestId,
      requestData,
      { new: true }
    );

    if (!existingRequest) {
      console.log(`Request with ID ${requestId} not found`);
      return res.status(404).json({ message: "Request not found" });
    }

    console.log(`Request with ID ${requestId} updated successfully`);

    // Send FCM notification if approveDeenAr is being updated to true

    const vehicle = await Vehicle.findOne({
      _id: existingRequest.vehicle,
    });

    if (!vehicle) {
      console.log(`Vehicle not found for request ID ${requestId}`);
      throw new Error("Vehicle not found for the reservation");
    }

    console.log(`Sending notification to driver (${vehicle.driverName})`);

    // const message = {
    //   data: {
    //     title: "New Reservation",
    //     body: "A new reservation has been added.",
    //     // You can add more custom data to be sent with the notification
    //   },
    //   topic: "drivers", // The topic to which drivers are subscribed
    // };

    // const response = await admin.messaging().send(message);

    // // Handle response if needed
    // console.log("FCM notification sent:", response);

    // console.log(`Notification sent to driver (${vehicle.driverName})`);

    // // Update Firestore (if needed)
    // const requestDocRef = requestCollection.doc(requestId);
    // await requestDocRef.set(requestData, { merge: true });

    // console.log(`Request data updated in Firestore for ID ${requestId}`);

    //send email to applier
    if(requestData.approveDeenAr){
        const emailDetails = requestApprovedEmail(requestData.destination, requestData.date)
        const { subject, html } = emailDetails;
        const request = await Request.findOne({_id: requestId}).populate({path: "applier", select: "email"}).lean()
        const emailResult = await emailService.sendEmail(
            request.applier.email,
            subject,
            html
         );
         if (!emailResult.success) {
            return {
               success: false,
               message: emailResult.message,
               data: null,
            };
         }

    }

    // Respond with success message and updated request object
    res.json({ status: "ok", updatedRequest: existingRequest });
  } catch (error) {
    console.error("Error occurred: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/getPassengers", auth, async (req, res) => {
  const requestId = req.query.requestId;
  try {
      const request = await Request.findById(requestId);
      if (!request) {
          return res.status(404).json({ message: "Request not found" });
      }
      res.json(request.passengers);
  } catch (err) {
      console.error("Error fetching request: ", err);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;




