const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSessionSchema = new Schema(
    {
    userId :{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    lastActivityTime: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
  },
  { timestamps: true }
)

const UserSession=mongoose.model("UserSession",userSessionSchema);

module.exports=UserSession;