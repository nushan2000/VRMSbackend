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
const path = require("path");
const fs = require("fs");
const User = require("../model/User");
//const emailService = new EmailService();
//const Tellio = require('twilio');
// Add a new request

// Setup multer (memory storage or disk storage based on your needs)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "documents"); // folder must exist or be created beforehand
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

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

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/"); // Make sure 'uploads' folder exists
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage: storage });

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
      documentUrls,
    } = req.body;

    // Parse passengers after receiving it as a string
    try {
      parsedPassengers = JSON.parse(passengers);
    } catch (e) {
      return res.status(400).json({ message: "Invalid passengers format" });
    }

    // Validate passengers array after parsing
    if (!Array.isArray(parsedPassengers) || parsedPassengers.length === 0) {
      return res
        .status(400)
        .json({ message: "Passengers data is missing or invalid" });
    }

    const uploadedFile = req.file;

    // Check for duplicate schedule before creating the document
    const existingSchedule = await Request.findOne({
      startTime,
      endTime,
      date,
    });

    if (existingSchedule) {
      return res
        .status(400)
        .json({ message: "Schedule already exists for this time and date!" });
    }

    //const deanUserr = await User.findOne({ email: "dean@mme.ruh.ac.lk".trim() });

    // console.log("dean",deanUserr); // Check full user object
    // const allUsers = await User.find({});
    // console.log(allUsers);

    const applyingUser = await User.findOne({ email: applier });
    console.log("email", applier);
    console.log("desig", applyingUser);

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
      documentUrls,
      // filePath: uploadedFile?.path || null
    });
    console.log(newRequest);

    // Save the request to MongoDB
    const savedRequest = await newRequest.save();

    // Send confirmation email to the applier
    sendEmail(
      applier,
      "Request Submitted",
      `Your request has been submitted successfully!`
    );

    // Fetch users asynchronously
    const headUser = await User.findOne({
      designation: "head",
      department: section,
    });
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

    // If date is not provided or invalid
    if (!requestDate) {
      return res.status(400).json({ error: "Date parameter is required." });
    }

    // Find approved requests for the date
    const requests = await Request.find({
      date: requestDate,
      approveDeenAr: true,
    });

    if (!requests || requests.length === 0) {
      console.log("No requests found for the given date.");
    }

    // Fetch all vehicles
    const allVehicles = await Vehicle.find();

    if (!allVehicles || allVehicles.length === 0) {
      return res.status(404).json({ error: "No vehicles found in the system." });
    }

    // Group passengers by vehicle ID
    const groupedData = requests.reduce((acc, request) => {
      const vehicleId = request?.vehicle?.toString(); // ensure it's a string
      const passengerCount = Array.isArray(request?.passengers)
        ? request.passengers.length
        : 0;

      if (!vehicleId) return acc;

      if (!acc[vehicleId]) {
        acc[vehicleId] = {
          vehicleId,
          totalPassengers: 0,
        };
      }

      acc[vehicleId].totalPassengers += passengerCount;
      return acc;
    }, {});

    // Convert to array
    const groupedArray = Object.values(groupedData || {});

    // Final output: loop through all vehicles and attach passenger counts
    const finalData = allVehicles.map((vehicle) => {
      const vehicleId = vehicle?._id?.toString();
      const grouped = groupedArray.find((g) => g.vehicleId === vehicleId);

      return {
        id: vehicleId,
        vehicleName: vehicle?.vehicleName || "Unknown",
        totalPassengers: grouped?.totalPassengers || 0,
        maxCapacity: vehicle?.sheatCapacity || 0,
        availableSeats:
          (vehicle?.sheatCapacity || 0) - (grouped?.totalPassengers || 0),
        status: vehicle?.status || "Unknown",
        availability: vehicle?.availability || "Unknown",
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

    if (requestData.approveStatus === "notApprovedHead") {
      try {
        const arUsers = await User.find({ designation: "ar" });
        const checkerUsers = await User.find({ designation: "checker" });
        const headUsers = await User.find({
          designation: "head",
          department: requestData.section,
        });
        const deanUsers = await User.find({ designation: "dean" });

        for (const user of headUsers) {
          await sendEmail(
            user.email,

            `New Request is added by ${req.body.applier}!`
          );
        }

        await sendEmail(
          req.body.applier,
          "Request Approved by Head",
          "Your request has been Approved by Head!"
        );
      } catch (emailErr) {
        console.error("Error sending head approval emails:", emailErr);
      }
    }
    if (requestData.approveStatus === "headApproved") {
      try {
        const arUsers = await User.find({ designation: "ar" });
        const checkerUsers = await User.find({ designation: "checker" });

        const deanUsers = await User.find({ designation: "dean" });

        for (const user of checkerUsers) {
          await sendEmail(
            user.email,
            "New Request Approved by Head",
            `This Request is added by ${req.body.applier}!`
          );
        }

        await sendEmail(
          req.body.applier,
          "Request Approved by Head",
          "Your request has been Approved by Head!"
        );
      } catch (emailErr) {
        console.error("Error sending head approval emails:", emailErr);
      }
    }
    if (requestData.approveStatus === "driverAssigned") {
      try {
        const arUsers = await User.find({ designation: "ar" });
        const checkerUsers = await User.find({ designation: "checker" });

        const deanUsers = await User.find({ designation: "dean" });

        for (const user of arUsers) {
          await sendEmail(
            user.email,
            "New Request Approved by Checker",
            `This Request is added by ${req.body.applier}!`
          );
        }

        await sendEmail(
          req.body.applier,
          "Request Approved by Checker",
          "Your request has been Approved by Checker!"
        );
      } catch (emailErr) {
        console.error("Error sending head approval emails:", emailErr);
      }
    }
    if (
      requestData.approveStatus === "arApproved" ||
      requestData.distance > 40
    ) {
      try {
        const arUsers = await User.find({ designation: "ar" });
        const checkerUsers = await User.find({ designation: "checker" });

        const deanUsers = await User.find({ designation: "dean" });

        for (const user of deanUsers) {
          await sendEmail(
            user.email,
            "New Request Approved by AR",
            `This Request is added by ${req.body.applier}!`
          );
        }

        await sendEmail(
          req.body.applier,
          "Request Approved by Checker",
          "Your request has been Approved by Checker!"
        );
      } catch (emailErr) {
        console.error("Error sending head approval emails:", emailErr);
      }
    }
    if (
      requestData.approveStatus === "arApproved" ||
      requestData.distance < 40
    ) {
      try {
        const arUsers = await User.find({ designation: "ar" });
        const checkerUsers = await User.find({ designation: "checker" });

        const deanUsers = await User.find({ designation: "dean" });

        await sendEmail(
          req.body.applier,
          "Request is Approved",
          "Your request has been Approved by AR!"
        );
      } catch (emailErr) {
        console.error("Error sending head approval emails:", emailErr);
      }
    }
    if (requestData.approveStatus === "deanApproved") {
      try {
        const arUsers = await User.find({ designation: "ar" });
        const checkerUsers = await User.find({ designation: "checker" });

        const deanUsers = await User.find({ designation: "dean" });

        await sendEmail(
          req.body.applier,
          "Request Approved by Dean",
          "Your request has been Approved by Dean!"
        );
      } catch (emailErr) {
        console.error("Error sending head approval emails:", emailErr);
      }
    }

    res.json({ status: "ok", updatedRequest: existingRequest });
  } catch (error) {
    console.error("Error occurred: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/requests/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRequest = await Request.findByIdAndDelete(id);
    if (!deletedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json({ message: "Request deleted successfully", deletedRequest });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting request", error: error.message });
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

router.post(
  "/upload-document",
  auth,
  upload.single("document"),
  async (req, res) => {
    try {
      const documentUrl = req.file.filename;
      console.log("successUP");
      res
        .status(200)
        .json({
          success: true,
          message: "Document uploaded successfully",
          data: { documentUrl },
        });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get("/get-document/:documentUrl", auth, async (req, res) => {
  try {
    const documentUrl = req.params.documentUrl;
    const filePath = path.join(__dirname, "../documents", documentUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Option 1: Download the file
    res.download(filePath); // prompts download in browser

    // Option 2: Just send the file for viewing (like PDF/image in browser)
    //res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete-document/:documentUrl", auth, async (req, res) => {
  try {
    const documentUrl = req.params.documentUrl;
    const filePath = path.join(__dirname, "../documents", documentUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res
      .status(200)
      .json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
