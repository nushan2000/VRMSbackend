const router = require("express").Router();
const admin = require("firebase-admin");
const Request = require("../model/Request");
const Vehicle = require("../model/Vehicle");
const Driver = require("../model/Driver");
const auth = require("../middleware/auth");
const { requestApprovedEmail } = require("../utills/emailTemplate");
const EmailService = require("../Services/email-service");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const multer = require("multer");
const User = require("../model/User");
//const emailService = new EmailService();
//const Tellio = require('twilio');
// Add a new request

const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email provider (e.g., Gmail, Outlook, SMTP)
  auth: {
    user: "efacwebapp@gmail.com", // Change this to your email
    pass: "kbjj xssh koxq uhyy", // Use an app password (for security)
  },
});

// Function to send email
const sendEmail = (to, subject, message) => {
  const mailOptions = {
    from: "efacwebapp@gmail.com",
    to,
    subject,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure 'uploads' folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post("/addrequest", upload.single("file"), auth, async (req, res) => {
  try {

    let approveHead; //line 112//for if dean ar add a request, is should automatically be head approved
    let parsedPassengers;
    const {
      date,
      startTime,
      endTime,
      reason,
      reasonFunded,
      vehicle,
      section,
      depatureLocation,
      destination,
      comeBack,
      
      approveDeenAr,
      distance,
      passengers,
      applier,
      applyDate,
    } = req.body;

    // Parse passengers after receiving it as a string
    try {
      parsedPassengers = JSON.parse(passengers);
    } catch (e) {
      return res.status(400).json({ message: "Invalid passengers format" });
    }

    // Validate passengers array after parsing
    if (!Array.isArray(parsedPassengers) || parsedPassengers.length === 0) {
      return res.status(400).json({ message: "Passengers data is missing or invalid" });
    }

    const uploadedFile = req.file;

    // Check for duplicate schedule before creating the document
    const existingSchedule = await Request.findOne({ startTime, endTime, date });

    if (existingSchedule) {
      return res.status(400).json({ message: "Schedule already exists for this time and date!" });
    }

   
    //const deanUserr = await User.findOne({ email: "dean@mme.ruh.ac.lk".trim() });

   // console.log("dean",deanUserr); // Check full user object
   // const allUsers = await User.find({});
// console.log(allUsers);

    const applyingUser = await User.findOne({email:applier});
    console.log("email",applier);
    console.log("desig",applyingUser);
    
if (applyingUser) {
  if (applyingUser.designation === "ar") approveHead = true;
  if (applyingUser.designation === "dean") approveHead = true;
  if (applyingUser.designation === "head") approveHead = true;
}
    // Create the MongoDB document
    const newRequest = new Request({
      date,
      startTime,
      endTime,
      reason,
      reasonFunded,
      vehicle,
      section,
      depatureLocation,
      destination,
      comeBack,
      distance,
      passengers: parsedPassengers,
      approveHead,
      approveDeenAr,
      applier,
      applyDate,
      driverStatus: "notStart",
      filePath: uploadedFile?.path || null
    });

    // Save the request to MongoDB
    const savedRequest = await newRequest.save();

    // Send confirmation email to the applier
    sendEmail(
      applier,
      "Request Submitted",
      `Your request has been submitted successfully!`
    );

    // Fetch users asynchronously
    const headUser = await User.findOne({ designation: "head", department: section });
    const arUser = await User.findOne({ designation: "ar" });
    const deanUser = await User.findOne({ designation: "dean" });

    if (headUser) {
      sendEmail(
        headUser.email,
        "New Request Added",
        `New request has been added by ${applier}!`
      );
    } else {
      if (arUser) {
        sendEmail(
          arUser.email,
          "New Request Added",
          `New request has been added by ${applier}!`
        );
      }
      if (deanUser) {
        sendEmail(
          deanUser.email,
          "New Request Added",
          `New request has been added by ${applier}!`
        );
      }
    }

    res.json({ status: "ok", newRequest: savedRequest });
  } catch (err) {
    console.error("Error occurred: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/requests", async (req, res) => {
  try {
    const requests = await Request.find();
    res.json(requests);
    //console.log(requests);
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
  try {
    const requestDate = req.params.date;
   // console.log("date", requestDate);
    const requests = await Request.find({
      date: requestDate,
      approveDeenAr: true,
    });
    //console.log("reqes", requests);

    const allVehicles = await Vehicle.find();
//console.log("all",allVehicles);

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
    //console.log("array group", groupedArray);

    const vehicleNames = groupedArray.map((v) => v.vehicleName);
    //console.log("vehicle name",vehicleNames);

    const vehicles = await Vehicle.find({ _id: { $in: vehicleNames } });
   // console.log("id",vehicles._id);

    // const finalDat = groupedArray.map(group => {
    //     const vehicle = vehicles.find(v => v.vehicleName === group.vehicleName);
    //     return {
    //         vehicleName: group.vehicleName,
    //         totalPassengers: group.totalPassengers,
    //         maxCapacity: vehicle ? vehicle.sheatCapacity : "Unknown", // Use sheatCapacity from Vehicle
    //         availableSeats: vehicle
    //             ? vehicle.sheatCapacity - group.totalPassengers
    //             : "Unknown", // Calculate available seats
    //         status: vehicle ? vehicle.status : "Unknown", // Include vehicle status
    //         availability: vehicle ? vehicle.availability : "Unknown", // Include availability
    //     };
    // });
    const finalData = allVehicles.map((vehicle) => {
      //console.log("ingroup",vehicle);
      
      // Find the matching grouped data for this vehicle
      const grouped = groupedArray.find(
        (g) => g.vehicleName === vehicle._id.toString()
      );
      //console.log("group", grouped);

      return {
        id: vehicle._id,
        vehicleName: vehicle.vehicleName,
        totalPassengers: grouped ? grouped.totalPassengers : 0,
        maxCapacity: vehicle.sheatCapacity, // Use sheatCapacity from Vehicle
        availableSeats:
          vehicle.sheatCapacity - (grouped ? grouped.totalPassengers : 0),
        status: vehicle.status, // Include vehicle status
        availability: vehicle.availability, // Include availability
      };
    });

    res.json(finalData);
  } catch (err) {
    //console.error("Error fetching requests: ", err);
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
    // if (
    //   !Array.isArray(requestData.passengers) ||
    //   requestData.passengers.length === 0
    // ) {
    //   throw new Error("Passengers data is missing or invalid");
    // }

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
    console.log("data", existingRequest.vehicle);
    const vehicle = await Vehicle.findById(existingRequest.vehicle).lean();

    if (!vehicle) {
      console.log(`Vehicle not found for request ID ${requestId}`);
      throw new Error("Vehicle not found for the reservation");
    }

    console.log(`Sending notification to driver (${vehicle.driverName})`);

    if (requestData.approveDeenAr) {

      const driver = await Driver.findOne({ vehicleId:existingRequest.vehicle });

      

      sendEmail(
        req.body.applier,
        "Request Approved by Deen or Ar",
        `Your request has been Approved!`
      );
      
      const emailDetails = requestApprovedEmail(
        requestData.destination,
        requestData.date
      );
      const { subject, html } = emailDetails;
      // const emailResult = await emailService.sendEmail(
      //     existingRequest.applier,
      //     subject,
      //     html
      //  );
      //  if (!emailResult.success) {
      //     return {
      //        success: false,
      //        message: emailResult.message,
      //        data: null,
      //     };
      //  }

      //  const notificationSended = await sendNotification(existingRequest.vehicle,existingRequest.date,existingRequest.startTime, existingRequest.comeBack, existingRequest.destination);
      //  console.log(notificationSended);
    } else if (requestData.approveHead) {
        const arUser = User.find({ designation: "ar"});
      console.log("head user ", arUser);
      const deanUser = User.find({ designation: "dean"});
      console.log("head user ", deanUser);
      sendEmail(
        deanUser.email,
        "New Request is Added that approved by head",
        `This Request is Added by ${req.body.applier}!`
      );
      sendEmail(
        arUser.email,
        "New Request is Added that approved by head",
        `This Request is Added by ${req.body.applier}!`
      );
      sendEmail(
        req.body.applier,
        "Request Approved by Head",
        `Your request has been Approved by Head!`
      );
    }

    // Respond with success message and updated request object
    res.json({ status: "ok", updatedRequest: existingRequest });
  } catch (error) {
    console.error("Error occurred: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete('/requests/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const deletedRequest = await Request.findByIdAndDelete(id);
      if (!deletedRequest) {
          return res.status(404).json({ message: 'Request not found' });
      }
      res.json({ message: 'Request deleted successfully', deletedRequest });
  } catch (error) {
      res.status(500).json({ message: 'Error deleting request', error: error.message });
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

// Get all requests
router.get("/requests-mobile", auth, async (req, res) => {
  const { vehicleId, driverStatus } = req.query;
  console.log(typeof vehicleId, driverStatus);
  try {
    if (!vehicleId || !driverStatus) {
      const missingFields = [];
      if (!vehicleId) {
        missingFields.push("vehicleId");
      }
      if (!driverStatus) {
        missingFields.push("driverStatus");
      }
      const errorMessage = `Required fields are missing : ${missingFields.join(
        ", "
      )}`;
      return res.status(200).json({ message: errorMessage });
    }
    const vehicleObjectId = new mongoose.Types.ObjectId(vehicleId);
    console.log(typeof vehicleObjectId);
    const requests = await Request.find({
      vehicle: vehicleId,
      driverStatus: driverStatus,
      approveHead: true,
      approveDeenAr: true,
    });

    console.log(requests);

    if (requests.length == 0) {
      return res.json({ requests: [] });
    }
    const formatedRequests = requests.map((request) => {
      return {
        requestId: request._id,
        date: request.date,
        startTime: request.startTime,
        passengerCount: request.passengers.length,
        from: request.depatureLocation,
        to: request.destination,
        status: request.driverStatus,
      };
    });
    res.json({ requests: formatedRequests });
  } catch (err) {
    console.error("Error fetching requests: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/status/update/:id", auth, async (req, res) => {
  try {
    const requestId = req.params.id;
    const dirverStatus = req.body.driverStatus;

    if (!requestId && !dirverStatus) {
      return status(400).json({ error: "missing field" });
    }

    const request = await Request.findById(requestId);

    if (!request) {
      return status(400).json({ error: "no request" });
    }

    const updateData = {};

    if (dirverStatus) {
      updateData.driverStatus = dirverStatus;
    }

    await request.updateOne(updateData);
    res.json({ requests: updateData.driverStatus });
  } catch (err) {
    console.error("Error with update: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const sendNotification = async (
  vehicleId,
  date,
  startTime,
  comeBack,
  destination
) => {
  if (mongoose.Types.ObjectId.isValid(vehicleId)) {
    const objectId = new mongoose.Types.ObjectId(vehicleId);
    console.log(objectId);
  } else {
    console.log("Invalid vehicleId");
  }

  const driverDriverDetails = await Driver.findOne({ vehicleId }).lean();
  const title = "Faculty of Engineering Uor";
  const body = `🚗 Your trip details:
    📅 Date: ${date}
    ⏰ Start Time: ${startTime}
    🔄 Come Back: ${comeBack}
    📍 Destination: ${destination}`;

  if (!driverDriverDetails) {
    return res.status(400).json({ error: "Device not found" });
  }

  const driverToken = driverDriverDetails.mobileAppId;
  console.log(driverToken);
  if (!driverToken) {
    return res.status(400).json({ error: "Device token is required" });
  }

  const message = {
    notification: {
      title,
      body,
    },
    token: driverToken,
  };

  try {
    await admin.messaging().send(message);
    return { success: true, message: "Notification sent" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = router;
