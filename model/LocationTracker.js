const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const locationSchema= new Schema({
    currentLocation : {
        type:String,
        require:true

    },

    currentVelocity :{
        type: String,
        require:true
    },

    latitude:{
        type:String,
        require:true
    },

    longitude: {
        type:String,
        require:true
    }



})

const LocationDetails=mongoose.model("LocationDetails",locationSchema);

module.exports=LocationDetails;