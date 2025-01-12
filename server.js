const express =require("express");
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
const cors= require("cors");
const dotenv=require("dotenv")
const app=express();
require("dotenv").config();

const http = require('http');
const websocket = require('./webShocket.js');




const server = http.createServer(app);




const PORT1=process.env.PORT ||8080;



  

app.use(cors());
app.use(bodyParser.json());

const URL=process.env.MONGODB_URL;

mongoose.connect(URL,{
    
   // userCreateIndex:true,
   // userNewUrlParser:true,
   // useUnifiedTopologyL:true,
   // userFindAndModify:false
})

const connection=mongoose.connection;
connection.once('open',()=>{
    console.log("Mongodb Connection success")
})


function authenticateToken(req,res,next) {

    const requestPath =req.originalUrl;

    if(requestPath === "/user/login"){
        return next();
    }

    if(requestPath === "/vehicle/vehicles"){
        return next();
    }

    const authoHeader = req.headrers['authorization'];
    const token = authoHeader && authoHeader.slipt('')[1];
    if(token == null){
        console.log("run")
        if(!req.isAuthenticated){
        return res.redirect("/")
        }
    }

    jwt.verify(token, process.env.JWT_SE, (err, user) => {
        if(err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();

    })

    
}


const requestRouter = require("./routes/Requests.js");
const userRouter=require("./routes/Users.js");
const vehicleRouter=require("./routes/Vehicles.js");
const locationDetail = require("./routes/LocationTrackers.js")
const availableSeats = require("./routes/availableSheats.js")
const cost = require('./routes/CostCalculations');
const feedbackRouter = require("./routes/Feedbacks.js");

app.use("/availableSeats",availableSeats)
app.use("/request",requestRouter);
app.use("/user",userRouter);
app.use("/vehicle",vehicleRouter);
app.use("/location-details",locationDetail)
app.use('/costDetails', cost);
app.use("/user/feedback",feedbackRouter);

app.listen(PORT1,()=>{
    console.log('server is up and running no port '+PORT1);

})
