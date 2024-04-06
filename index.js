require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/marvel");
cloudinary.config({
  cloud_name: "dp4lxciap",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  try {
    return res.status(200).json("⚡️ Welcome on my Marvel server ⚡️");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// routes =>
const userRoutes = require("./routes/user");
app.use(userRoutes);
const charactersRoutes = require("./routes/characters");
app.use(charactersRoutes);
const comicsRoutes = require("./routes/comics");
app.use(comicsRoutes);

app.all("*", (req, res) => {
  return res.status(404).json("Not found");
});

app.listen(process.env.PORT, () => {
  console.log("⚡️ server up & running ⚡️");
});
