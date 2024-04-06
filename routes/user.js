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
      if (req.body.email && req.body.password && req.body.username) {
        //if so, generate a token & a salt then hash the password+salt combination
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.body.password + salt).toString(encBase64);

        // create new user with those credentials
        const newUser = new User({
          email: req.body.email,
          username: req.body.username,
          token: token,
          hash: hash,
          salt: salt,
        });

        //save newUser in database
        await newUser.save();

        const responseObject = {
          _id: newUser._id,
          token: newUser.token,
          username: newUser.username,
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

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    //is there an user with this email
    if (user) {
      //check password

      if (
        SHA256(req.body.password + user.salt).toString(encBase64) === user.hash
      ) {
        return res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        return res.status(401).json({ error: "Invalid email or password" });
      }
    } else {
      return res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
