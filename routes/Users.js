const router=require("express").Router();
const express=require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require("../model/User");



// user signup 


router.post('/signup',async(req,res)=>{
    try{
        const fristName = req.body.fristName;
        const lastName = req.body.lastName;
        const department = req.body.department;
        const email = req.body.email;
        const designation  = req.body.designation ;//drop down
        const password = req.body.password; 
        const repassword = req.body.repassword;
        const telNo = req.body.telNo;   
            
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
    
        const newUser = new User({
          fristName,
          lastName,
          department,
          designation ,
          email,
          password: hashedPassword,
          repassword,
          telNo,
          

        });
        
        await newUser.save();
    
        res.status(201).json({ message: 'User registered successfully' });
    }catch (error) {
        res.status(500).json({ message: 'Internal server error' });
      }





})
// User login
router.route("/login").post((req,res)=>{
    const email = req.body.email; 
    const password = req.body.password;

    const generateToken=(id)=>{
      return jwt.sign({id},process.env.JWT_SE,{
          expiresIn:"1h",
      });
    };
  
    if(email == "" || password == "" ){
        res.json({
            status : "FAILED" , 
            message: "Empty input  email or password"
        });
    }else {
        //checking exist user
        const user=User.findOne({email}).then((user)=>{
            if(user){
                //user exist
  const hashedPassword = user.password;
                bcrypt.compare(password,hashedPassword).then((result)=>{
                    if(result){
                        res.json({
                          _id:user._id,
                          email:user.email,
                          fristName:user.fristName,
                          lastName:user.lastName,
                          designation:user.designation,
                          token:generateToken(user._id)
                          
                        });
                        
                    }else{
                        res.json({
                            status : "FAILED" , 
                            message: "Invalied password"
                        });
                    }
                }).catch(()=>{
                    res.json({
                        status : "FAILED" , 
                        message: "An error occurred while comparing"
                    });
                })
            }else{
                res.json({
                    status : "FAILED" , 
                    message: "invalied email"
                });
            }
        }).catch(()=>{
            res.json({
                status : "FAILED" , 
                message: "An error occurred while checking for existing user"
            });
        })
  
  
    }
  
  })

// all user data read
router.get('/users', async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // delete user using id
  router.delete('/usersdelete/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findByIdAndDelete(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'user not found' });
      }
  
      res.json({ message: 'user deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // update user using id
  router.put('/update/:id', async (req, res) => {
    const userId = req.params.id;
    const updateduser = req.body;
  
    try {
      const user = await User.findByIdAndUpdate(userId, updateduser, { new: true });
  
      if (!user) {
        return res.status(404).json({ message: 'user not found' });
      }
  
      return res.status(200).json({ message: 'user updated successfully', user });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
//all functions are working

module.exports=router;