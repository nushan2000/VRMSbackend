const router=require("express").Router();
const express=require('express');
const bodyParser = require('body-parser');
const auth = require("../middleware/auth");
const Vehicle = require("../model/Vehicle");
const Driver = require("../model/Driver");

const app =express()
const path=require('path')  
app.use(bodyParser.json({ limit: '1000mb' })); // Adjust the limit based on your needs
app.use(bodyParser.urlencoded({ extended: true, limit: '1000mb' })); // Adjust the limit based on your needs

//add vehicle
router.route("/addVehicle", auth).post(async(req,res)=>{
    let vehicleNo=req.body.vehicleNo;
    let vehicleType=req.body.vehicleType;
    let sheatCapacity=req.body.sheatCapacity;
    let {vehicleImg} =req.body;
    let vehicleName=req.body.vehicleName;
    let driverId = req.body.driverId;
    
    try{
       const cteratedVehicle = Vehicle.create({         
        vehicleNo,
        vehicleType,
        sheatCapacity, 
        avilableSheat: sheatCapacity,       
        status:"yes",
        availability: 'yes',
        vehicleImg,
        vehicleName,
        driverId,
      })



        //update driver profile
        if(driverId){
          const updatedDriver = await Driver.findByIdAndUpdate(
            {
              _id: driverId
            },
            {
              vehicleId: cteratedVehicle._id 
            }
          )
          if(!updatedDriver) {
            return res.status(200).json({ message: 'Update driver prifile failed' });
          }
        }
    }catch(error){
      console.error(error.message)
    }
})

router.post('/vehicle/:id/addStatusDate', auth,  async (req, res) => {
  const vehicleId = req.params.id;
  const { date } = req.body;

  if (!date) {
      return res.status(400).send('Date is required');
  }

  try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
          return res.status(404).send('Vehicle not found');
      }

      vehicle.statusDate.push(new Date(date)); // Add the new date
      await vehicle.save();
      res.status(200).send(vehicle);
  } catch (error) {
      res.status(500).send(error);
  }
});
//read all vehicles
router.get('/vehicles', async (req, res) => {
    try {
      const vehicles = await Vehicle.find();
      res.json(vehicles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  //delete vehicle by id
  router.delete('/vehiclesdelete/:id', auth, async (req, res) => {
    try {
      const vehicleId = req.params.id;
      const vehicle = await Vehicle.findByIdAndDelete(vehicleId);
  
      if (!vehicle) {
        return res.status(404).json({ message: 'vehicle not found' });
      }
  
      res.json({ message: 'vehicle deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  
  //update vehicle by id
  router.put('/updateVeh/:id', auth, async (req, res) => {
    const vehicleId = req.params.id;
    const updatedVehicle = req.body;
  
    try {
      console.log("Updated vehicle data received:", updatedVehicle); // Debug: log the updated vehicle data received
  
      // Use $set to ensure the statusList field is correctly updated
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { $set: {
            vehicleNo: updatedVehicle.vehicleNo,
            vehicleType: updatedVehicle.vehicleType,
            sheatCapacity: updatedVehicle.sheatCapacity,
            avilableSheat: updatedVehicle.avilableSheat,
            driverName: updatedVehicle.driverName,
            driverEmail: updatedVehicle.driverEmail,
            vehicleName: updatedVehicle.vehicleName,
            availability: updatedVehicle.availability,
            status: updatedVehicle.status,
            vehicleImg: updatedVehicle.vehicleImg,
            statusList: updatedVehicle.statusList, // Explicitly set statusList
            driverId: updatedVehicle.driverId,
        } },
        { new: true, runValidators: true }
      );
  
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
  
      console.log("Vehicle after update:", vehicle); // Debug: log the vehicle after update

      //update driver profile
      const updatedDriver = await Driver.findByIdAndUpdate(
        {
          _id: updatedVehicle.driverId
        },
        {
          vehicleId 
        }
      )

      if(!updatedDriver) {
        return res.status(404).json({ message: 'Update driver prifile failed' });
      }
  
      return res.status(200).json({ message: 'Vehicle updated successfully', vehicle });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
//all functions are working
module.exports=router;