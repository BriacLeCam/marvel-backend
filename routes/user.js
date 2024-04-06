// express server
const express = require("express");
const router = express.Router();

//password encryption
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");

//avatar utils
const fileUpload = require("express-fileupload");
const convertToBase64 = require("../utils/convertToBase64");
const cloudinary = require("cloudinary").v2;

//models import
const User = require("../models/User");

//signup route
router.post("/user/signup", fileUpload(), async (req, res) => {
  //check for existing email accounts
  try {
    const user = await User.findOne({ email: req.body.email });

    //if email exists => stop process and provide info
    if (user) {
      return res.status(400).json("This email already has an account");
    }
    //if email doesn't exists => continue signup process
    else {
      //check if all required informations are provided
      if (req.body.email && req.body.password && req.body.account.username) {
        //if so, generate a token & a salt then hash the password+salt combination
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.body.password + salt).toString(encBase64);

        // create new user with those credentials
        const newUser = new User({
          email: req.body.email,
          account: {
            username: req.body.account.username,
          },
          token: token,
          hash: hash,
          salt: salt,
        });

        //if there is an avatar image provided, upload on cloudinary and save result in user's account
        if (req.files?.avatar) {
          const result = await cloudinary.uploader.upload(
            convertToBase64(req.files.avatar),
            {
              folder: `marvel-backend-avatar${newUser._id}`,
              public_id: "avatar",
            }
          );

          newUser.account.avatar = result;
        }

        //save newUser in database
        await newUser.save();

        const responseObject = {
          _id: newUser._id,
          token: newUser.token,
          account: {
            username: newUser.account.username,
          },
        };

        return res.status(201).json(responseObject);
      }
      //user didn't provide all required information
      else {
        return res.status(409).json("Missing information");
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// router.post("/user/login", async (req, res) => {
//   try {
//     // get user's salt & hash
//     // console.log(req.body);
//     const userFound = await User.findOne({ email: req.body.email });

//     if (!userFound) {
//       return res.status(401).json("Invalid email or password");
//     }

//     // adds salt to user's password and generate a new hash that will be compared to the one saved in the DB
//     const newHash = SHA256(req.body.password + userFound.salt).toString(
//       encBase64
//     );
//     if (newHash === userFound.hash) {
//       const responseObject = {
//         _id: userFound._id,
//         token: userFound.token,
//         account: {
//           username: userFound.account.username,
//         },
//       };
//       return res.status(200).json(responseObject);
//     } else {
//       return res.status(401).json("Email ou password incorrect");
//     }
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// });

module.exports = router;
