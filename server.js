const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const PORT = 5000;
const app = express();

//* connect mongodb
mongoose
  .connect("mongodb://localhost:27017/file-upload")
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

//* image schema
const imageSchema = new mongoose.Schema({
  url: String,
  public_id: String,
});
//*model
const Image = mongoose.model("Image", imageSchema);
//! Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//!configure multer storage cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "images-folder",
    format: async (req, file) => "png",
    public_id: (req, file) => file.fieldname + "_" + Date.now(),
    transformation: [{ width: 800, height: 600, crop: "fill" }],
  },
});

//!configure multer
const upload = multer({
  storage,
  limits: 1024 * 1020 * 5, //5mb limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! please upload an image", false));
    }
  },
});

//! uplaod route
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log(req.file);
  const uploaded = await Image.create({
    url: req.file.path,
    public_id: req.file.filename,
  });
  res.json({ message: "File uploaded", uploaded });
});
//! get all images
app.get("/images", async (req, res) => {
  try {
    const images = await Image.find();
    res.json({ images });
  } catch (err) {
    res.json(err);
  }
});
app.listen(PORT, console.log(`Server is running on ${PORT}`));
