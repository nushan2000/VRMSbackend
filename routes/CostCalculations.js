const express = require('express');
const router = express.Router();
const CostDetails = require("../model/CostCalculation");
const auth = require("../middleware/auth");



router.get('/vehicle-cost/calculation', auth, async (req, res) => {
  try {
      const model = 'camry';
      const vehicleResponse = await fetch(`https://api.api-ninjas.com/v1/cars?model=${model}`, {
          method: 'GET',
          headers: {
              'X-Api-Key': 'ZH8xUL5f7cWXSdXt2b6IZw==v8PIZcb7x7YlYDbH'
          }
      });

      if (!vehicleResponse.ok) {
          throw new Error('Network response was not ok');
      }

      const vehicleData = await vehicleResponse.json();
      console.log(vehicleData);

      // Extract distance from the request document
      const { distance } = req.body;

      // Get other parameters required for cost calculation
      // Assuming you have these fields in your request document or you fetch them from another source
      const { fuelConsumption, fuelPrice, serviceCharge, tirePrice } = req.body;

      // Calculate total cost using the CostCalculation model
      const totalCost = calculateCost(distance, fuelConsumption, fuelPrice, serviceCharge, tirePrice);

      // Update the existing request document with the total cost
      req.body.totalCost = totalCost;

      // Save the updated request document
      const updatedRequest = await RequestModel.findByIdAndUpdate(req.body._id, req.body, { new: true });

      console.log("Total cost for the trip:", totalCost.toFixed(2), "USD");
      res.status(200).json({ message: 'Cost details saved successfully.', data: updatedRequest });
  } catch (error) {
      console.error('Error saving cost data:', error);
      res.status(500).send('Internal server error');
  }
});

// Function to calculate cost for vehicle travel
function calculateCost(distance, fuelConsumption, fuelPrice, serviceCharge, tirePrice) {
  const serviceRate = serviceCharge / 5000;
  const fuelRate = fuelPrice / fuelConsumption;
  const tireRate = tirePrice / 20000;
  const totalCost = (serviceRate + fuelRate + tireRate) * distance;
  return totalCost;
}
router.get('/', async (req, res) => {
  try {
    const costDetails = await CostDetails.find();
    res.json(costDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get a specific cost detail by vehicle number
router.get('/:vehicleNo', auth, async (req, res) => {
  try {
    const costDetail = await CostDetails.findOne({ vehicleNo: req.params.vehicleNo });
    if (costDetail) {
      res.json(costDetail);
    } else {
      res.status(404).json({ message: 'Cost detail not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to create a new cost detail
router.post('/add', auth,  async (req, res) => {
  const costDetail = new CostDetails(req.body);
  try {
    const newCostDetail = await costDetail.save();
    res.status(201).json(newCostDetail);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to update a cost detail
router.put('/updatecost/:id', auth, async (req, res) => {
  const vehicleId = req.params.id;
    const updatedcost = req.body;
  try {
    const costDetail = await CostDetails.findByIdAndUpdate(vehicleId, updatedcost, { new: true });
    if (costDetail) {
     
      res.json(updatedcost);
    } else {
      res.status(404).json({ message: 'Cost detail not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to delete a cost detail
router.delete('/costdelete/:id', auth, async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const costDetail = await CostDetails.findOneAndDelete(vehicleId);
    if (costDetail) {
      res.json({ message: 'Cost detail deleted' });
    } else {
      
      res.status(404).json({ message: 'Cost detail not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports =router;