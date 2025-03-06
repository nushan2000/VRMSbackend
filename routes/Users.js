const router=require("express").Router();
const express=require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const multer = require('multer');
const xlsx = require('xlsx');
const User = require("../model/User");
const UserSession  = require("../model/userSession");
const { route } = require("./Requests");


const storage = multer.memoryStorage(); // Keeps file in memory (no need to save to disk)
const upload = multer({ storage });

router.post('/importUsers', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Get first sheet
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]); // Convert to JSON array

        const users = [];

        for (const row of sheetData) {
            const existingUser = await User.findOne({ email: row.email });

            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(row.password, 10);
                
                const user = {
                    fristName: row.fristName,
                    lastName: row.lastName,
                    department: row.department,
                    designation: row.designation,
                    email: row.email,
                    password: hashedPassword,
                    repassword: row.repassword,
                    telNo: row.telNo,
                };

                users.push(user);
            }
        }

        if (users.length > 0) {
            await User.insertMany(users); // Bulk insert all users at once
        }

        res.status(201).json({ message: `${users.length} users imported successfully` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
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
                      //generate token 
                      const token = jwt.sign(
                        {
                           userName: `${user.fristName} ${user.lastName}`,
                           userId: user._id,
                           email: user.email,
                        },
                        process.env.JWT_SECRET
                      );
                      //create user session
                      const session = new UserSession({
                        userId: user._id,
                        token
                      })
                      session.save()
                        res.json({
                          _id:user._id,
                          email:user.email,
                          fristName:user.fristName,
                          lastName:user.lastName,
                          designation:user.designation,
                          token,
                        });
                        
                    }else{
                        res.json({
                            status : "FAILED" , 
                            message: "Invalied password"
                        });
                    }
                }).catch((err)=>{
                  console.log(err);
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
router.get('/users', auth, async (req, res) => {
  const {designation} = req.query; 
    try {
      let users
      if (designation){
        users = await User.find({designation}).lean();
      } else {
        users = await User.find().lean();
      }
      const formatedUsers =  users.map((user) => {
        const {password, ...rest } = user
        return {
          ...rest
        }
      })
      res.json(formatedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // delete user using id
  router.delete('/usersdelete/:id', auth, async (req, res) => {
    try {
      const userId = req.params.id;
      if(!userId){
        return res.status(200).json({ message: 'User id is required' });
      }
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
  router.put('/update/:id', auth, async (req, res) => {
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

  router.get('/drivers', auth, async (req, res) => {
      try {
        const user = await User.findOne({
          _id: req.query.userId,
          designation: "driver"
        }).select('-_id -password').lean();
        res.json(user);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });
//all functions are working

router.get('/authLinks/:id', async(req, res) => {
  try{
    const userId = req.params.id;

    console.log(userId)

    const user = await User.findById(userId);

    if(!user){
      return res.status(404).json({ message: 'user not found' });
    }

    const userType = user.designation;

    res.json({'code':200,'data':userType });

  }catch(err){
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
})

module.exports=router;