const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const driverSchema= new Schema({
    fristName : {
        type:String,
        require:true
    },
    lastName :{
        type: String,
        require:true
    },
    email :{
        type: String,
        require:true
    },
    password:{
        type: String,
        require:true,
    },
    repassword:{
        type : String,
        require: true,
    },
    telNo:{
        type: String,
        require : true
    },
    userImg:{
        data:Buffer,
        contentType: String
    },
    vehicleId: {
        type: Schema.Types.ObjectId,
        ref: "Vehicle"
    },
    mobileAppId: {
        type:String,
        require:false
    }
 })

const User=mongoose.model("Driver",driverSchema);

module.exports=User;