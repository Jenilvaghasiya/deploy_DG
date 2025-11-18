import multer from "multer";
import path from "path";
import fs from "fs";

const MIME_TYPE_MAP = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
};

const socialPostStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "public/uploads/social/";

        // Check and create the directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
        console.log(file,"*************************");
    },
    filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = MIME_TYPE_MAP[file.mimetype] || ""; // fallback to empty if unknown
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const socialFileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/; // Allowed extensions
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype) {
        return cb(null, true);
    } else {
        cb(new Error(
            "Error: File upload only supports the following filetypes - " + filetypes
        ));
    }
};


const postUpload = multer({
    storage: socialPostStorage,
    // limits: {
    //     fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    // },
    fileFilter: socialFileFilter,
});

export default postUpload;
