const express =require("express");
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
const cors= require("cors");
const dotenv=require("dotenv");
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');
const app=express();
const os = require("os"); 
const si = require("systeminformation"); 
require("dotenv").config();

const http = require('http');
const websocket = require('./webShocket.js');



const server = http.createServer(app);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });


const PORT1 = process.env.PORT || 8080;
app.get("/api/system-info", async (req, res) => {
  try {
    const cpu = os.cpus()[0].model;
    const totalRAM = os.totalmem() / (1024 * 1024 * 1024); // Convert to GB
    const freeRAM = os.freemem() / (1024 * 1024 * 1024); // Convert to GB
    const osType = os.type();
    const osPlatform = os.platform();
    const osRelease = os.release();
    const diskInfo = await si.diskLayout();

    res.json({
      cpu,
      totalRAM: totalRAM.toFixed(2) + " GB",
      freeRAM: freeRAM.toFixed(2) + " GB",
      osType,
      osPlatform,
      osRelease,
      storage: diskInfo.map(disk => ({
        device: disk.device,
        size: (disk.size / (1024 * 1024 * 1024)).toFixed(2) + " GB",
        type: disk.type,
      })),
    });
  } catch (error) {
    console.error("System Info Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
});





app.use(cors());
app.use(bodyParser.json());

const URL = process.env.MONGODB_URL;

mongoose.connect(URL, {

    // userCreateIndex:true,
    // userNewUrlParser:true,
    // useUnifiedTopologyL:true,
    // userFindAndModify:false
})

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("Mongodb Connection success")
})


// function authenticateToken(req, res, next) {

//     const requestPath = req.originalUrl;

//     if (requestPath === "/user/login") {
//         return next();
//     }

//     if (requestPath === "/vehicle/vehicles") {
//         return next();
//     }

//     const authoHeader = req.headrers['authorization'];
//     const token = authoHeader && authoHeader.slipt('')[1];
//     if (token == null) {
//         console.log("run")
//         if (!req.isAuthenticated) {
//             return res.redirect("/")
//         }
//     }

//     jwt.verify(token, process.env.JWT_SE, (err, user) => {
//         if (err) {
//             return res.sendStatus(403);
//         }

//         req.user = user;
//         next();

//     })


// }
app.get('/', (req, res) => {
  res.send('Server is running');
});


app.get('/', (req, res) => {
  res.send('Server is running');
});

const requestRouter = require("./routes/Requests.js");
const userRouter = require("./routes/Users.js");
const vehicleRouter = require("./routes/Vehicles.js");
const locationDetail = require("./routes/LocationTrackers.js")
const availableSeats = require("./routes/availableSheats.js")
const cost = require('./routes/CostCalculations');
const feedbackRouter = require("./routes/Feedbacks.js");
const driverRouter = require("./routes/driver.js");

app.use("/availableSeats", availableSeats)
app.use("/request", requestRouter);
app.use("/user", userRouter);
app.use("/vehicle", vehicleRouter);
app.use("/location-details", locationDetail)
app.use('/costDetails', cost);
app.use("/user/feedback", feedbackRouter);
app.use("/driver", driverRouter);

app.listen(PORT1, () => {
    console.log('server is up and running no port ' + PORT1);

})