//reqest form
const mongoose = require("mongoose");
const { Types } = require("mongoose/lib/schema");

const Schema = mongoose.Schema;

const passengerSchema = new mongoose.Schema({
  name: String,
  position: String,
  pickup: String,
  drop: String,
});

const requestSchema = new Schema({
  date: {
    type: String,
    require: true,
  },
  startTime: {
    type: String,
    require: true,
  },
  endTime: {
    type: String,
    require: true,
  },
  reason: {
    type: String,
    require: true,
  },
  reasonFunded: {
    type: String,
    require: true,
  },
  section: {
    type: String,
    require: true,
  },
  vehicle: {
    type: String,
    require: false,
  },
  depatureLocation: {
    type: String,
    require: true,
  },
  destination: {
    type: String,
    require: true,
  },
  comeBack: {
    type: Boolean,
    require: true,
  },
  distance: {
    type: Number,
    require: true,
  },
  approveHead: {
    type: Boolean,
    default: false,
  },
  approveDeenAr: {
    type: Boolean,
    default: false,
  },
  approveDeen: {
    type: Boolean,
    default: false,
  },
  approveChecker: {
    type: Boolean,
    default: false,
  },
  driverStatus: {
    type: String,
    default: "notStart",
  },
  applier: {
    type: String,
    require: true,
  },
  applyDate: {
    type: Date,
    default: Date.now(),
  },
  departmentHeadNote: {
    type: String,
  },
  arDeanNote: {
    type: String,
  },
  deanNote: {
    type: String,
  },
  checkerNote: {
    type: String,
  },
  approveStatus: {
    type: String,
    default: "notApprovedHead",
  },
  filePath: {
    type: String,
    default: false,
  },
  startDateTime: {
    type: String,
  },
  endDateTime: {
    type: String,
  },
  documentUrls: { type: String },

  passengers: [passengerSchema],
});
const Request = mongoose.model("Request", requestSchema);
module.exports = Request;
