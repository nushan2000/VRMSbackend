const router = require("express").Router();
const admin = require('firebase-admin');
const Request = require("../model/Request");
const Vehicle = require("../model/Vehicle");
const { requestCollection } = require('../config');
const auth = require("../middleware/auth");

// Initialize Firebase Admin SDK



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
            departureLocation,
            destination,
            comeBack,
            distance,
            passengers,
            approveHead,
            approveDeenAr,
            applier,
            applyDate,
            driverStatus
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
            departureLocation,
            destination,
            comeBack,
            distance,
            passengers,
            approveHead: false,
            approveDeenAr: false,
            applier,
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



// Update a request by ID
router.put("/updateRequest1/:id", auth, async (req, res) => {
    const requestId = req.params.id;
    const requestData = req.body;

    try {
        console.log(`Updating request with ID: ${requestId}`);

        // Validate passengers array
        if (!Array.isArray(requestData.passengers) || requestData.passengers.length === 0) {
            throw new Error('Passengers data is missing or invalid');
        }

        // Find and update the request in MongoDB
        const existingRequest = await Request.findByIdAndUpdate(requestId, requestData, { new: true });

        if (!existingRequest) {
            console.log(`Request with ID ${requestId} not found`);
            return res.status(404).json({ message: "Request not found" });
        }

        console.log(`Request with ID ${requestId} updated successfully`);

        // Send FCM notification if approveDeenAr is being updated to true
       
            const vehicle = await Vehicle.findOne({ vehicleName: existingRequest.vehicle });

            if (!vehicle) {
                console.log(`Vehicle not found for request ID ${requestId}`);
                throw new Error('Vehicle not found for the reservation');
            }

            console.log(`Sending notification to driver (${vehicle.driverName})`);

            const message = {
                data: {
                    title: 'New Reservation',
                    body: 'A new reservation has been added.',
                    // You can add more custom data to be sent with the notification
                },
                topic: 'drivers', // The topic to which drivers are subscribed
            };

            const response = await admin.messaging().send(message);

        // Handle response if needed
            console.log('FCM notification sent:', response);

            console.log(`Notification sent to driver (${vehicle.driverName})`);
       

        // Update Firestore (if needed)
        const requestDocRef = requestCollection.doc(requestId);
        await requestDocRef.set(requestData, { merge: true });

        console.log(`Request data updated in Firestore for ID ${requestId}`);

        // Respond with success message and updated request object
        res.json({ status: "ok", updatedRequest: existingRequest });
    } catch (error) {
        console.error("Error occurred: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;




