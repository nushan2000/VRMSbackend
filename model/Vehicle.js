const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const statusDateSchema = new mongoose.Schema({
    statusDate:String,
    newStatus:String
  });

  const StatusSchema = new Schema({
    statusDate: { type: Date, required: true },
    newStatus: { type: String, required: true }
  });
const vehicleSchema= new Schema({
    vehicleNo : {
        type:String,
        require:true

    },

    vehicleType :{
        type: String,
        require:true
    },
    sheatCapacity :{
        type: Number,
        require:true
    },
    avilableSheat:{
        type: Number,
        default: function () {
            return this.sheatCapacity; // Set default value to sheatCapacity
        }

    },
    driverName:{
        type: String,
        require:true,
    },
    vehicleImg:{

        type:String,
        
    },
    status:{

        type:String,
        default: "yes",
        
    },


    availability:{

        
        type:String,
        default: "yes",
        
    },
    driverEmail:{
        type:String,
        require:true,
    },
    vehicleName:{
        type:String,
        required:true,
    },
    vehiStatus: [statusDateSchema],
    statusList: [StatusSchema]

})

const Vehicle=mongoose.model('Vehicle',vehicleSchema);

module.exports=Vehicle;