const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema= new Schema({
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
    department:{
        type: String,
        require : true
    },
    password:{
        type: String,
        require:true,
    },
    repassword:{
        type : String,
        require: true,
    },
    designation :{
        type: String,
        require : true
    },
    telNo:{
        type: String,
        require : true
    },
    userImg:{
        data:Buffer,
        contentType: String
    },
 })

const User=mongoose.model("User",userSchema);

module.exports=User;