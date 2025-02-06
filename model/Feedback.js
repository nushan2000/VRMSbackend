const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const feedbackSchema= new Schema({

    vehicleNo : {
        type : String,
        require : true
    },
    punctuality : {
        type:String,
        require:true

    },

    ProfessionalismOfTheDriver :{
        type: String,
        require:true
    },
    CleanlinessOfTheTaxi :{
        type: String,
        require:true
    },
    comfortOfTheRide:{
        type: String,
        require : true

    },
    overallSatisfaction:{
        type: String,
        require:true,
    },
    otherFeedback:{
        type : String,
        require: true,
        
        
    },
    SuggestionsForImprovement :{
        type: String,
        require : true
    }
})

const Feedback=mongoose.model("Feedback",feedbackSchema);

module.exports=Feedback;