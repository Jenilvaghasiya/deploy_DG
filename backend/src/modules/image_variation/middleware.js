// backend-genie/src/modules/image_variation/middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";
import mime from 'mime-types'; // add at the top of your file

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "public/uploads/moodboards/";

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    console.log(file.originalname, "*************************");

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);

    // If no extension in original name, get it from mimetype
    if (!ext) {
      ext = mime.extension(file.mimetype);
      if (ext) ext = '.' + ext;
      else ext = ''; // fallback, but ideally mimetype should be valid
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log(file.originalname, ext, "*************************");

    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const imageFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/; // Allowed file types
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase(),
  );

  if (mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Only JPEG, JPG, and PNG files are allowed");
  }
};

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
});

export default imageUpload;
