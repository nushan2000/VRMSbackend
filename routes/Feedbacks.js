const router=require("express").Router();
const express=require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const auth = require("../middleware/auth");

const FeedBack = require("../model/Feedback");

router.post('/feedback-submit',auth, async(req,res) => {
    try{
        const vehicleNo = req.body.vehicleNo
        const punctuality = req.body.punctuality;
        const ProfessionalismOfTheDriver = req.body.ProfessionalismOfTheDriver;
        const CleanlinessOfTheTaxi = req.body.CleanlinessOfTheTaxi;
        const comfortOfTheRide = req.body.comfortOfTheRide;
        const overallSatisfaction = req.body.overallSatisfaction;
        const otherFeedback = req.body.otherFeedback;
        const SuggestionsForImprovement = req.body.SuggestionsForImprovement;
        const newFeedback =new FeedBack ({
            vehicleNo,
            punctuality,
            ProfessionalismOfTheDriver,
            CleanlinessOfTheTaxi,
            comfortOfTheRide,
            overallSatisfaction,
            otherFeedback,
            SuggestionsForImprovement
        })
        await newFeedback.save();
        res.status(201).json({message: 'Feedback submited'})
    } catch (error){
        res.status(500).json({message : 'Internal server error'});
    }
})

router.get('/feedbacks', async (req,res) => {
    try{
        const feedbacks = await FeedBack.find();
        res.json(feedbacks);
    } catch (error) {
        
        console.error(error);
        res.status(500).json({message : 'Internal server error'})
    }
})

//genarate qr
router.get('/generate-qr', auth, async (req, res) => {
    try {
        const vehicleNumber = req.params.vehicleNumber;
        const qrData = `http://localhost:3001/user/feedback?vehicle=${vehicleNumber}`;
        const qrCode = await QRCode.toDataURL(qrData);
        res.send(qrCode);
      } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
});


module.exports=router;