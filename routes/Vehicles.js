const router=require("express").Router();
const express=require('express');
const bodyParser = require('body-parser');

const Vehicle = require("../model/Vehicle");
const {vehicleCollection}=require('../config')

const app =express()
const path=require('path')  

app.use(bodyParser.json({ limit: '1000mb' })); // Adjust the limit based on your needs
app.use(bodyParser.urlencoded({ extended: true, limit: '1000mb' })); // Adjust the limit based on your needs

//add vehicle





router.route("/addVehicle").post(async(req,res)=>{
    let vehicleNo=req.body.vehicleNo;
    let vehicleType=req.body.vehicleType;
    let sheatCapacity=req.body.sheatCapacity;
    
    let driverName=req.body.driverName;
    
   
    let {vehicleImg} =req.body;
    let driverEmail=req.body.driverEmail;
    let vehicleName=req.body.vehicleName;
    
    try{
      Vehicle.create({         
        vehicleNo,
        vehicleNo,
        vehicleType,
        sheatCapacity, 
        avilableSheat: sheatCapacity,       
        driverName,
        status:"yes",
        availability: 'yes',
        vehicleImg,
        driverEmail,
        vehicleName
      })

        await vehicleCollection.doc(vehicleNo).set({
          vehicleNo,
          vehicleType,
          sheatCapacity,         
          driverName,       
          driverEmail,
          vehicleName,
          status:"yes",
        availability: 'yes',
        avilableSheat: sheatCapacity, 
        vehicleImg,
        }); 

       
    }catch(error){
      console.error(error.message)
    }
    


    
})

router.post('/vehicle/:id/addStatusDate', async (req, res) => {
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
  router.delete('/vehiclesdelete/:id', async (req, res) => {
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
  router.put('/updateVeh/:id', async (req, res) => {
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
        } },
        { new: true, runValidators: true }
      );
  
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
  
      console.log("Vehicle after update:", vehicle); // Debug: log the vehicle after update
  
      return res.status(200).json({ message: 'Vehicle updated successfully', vehicle });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
//all functions are working
module.exports=router;