import multer from "multer";
import path from "path";
import fs from "fs";

const projectStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "public/uploads/projects/";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});

const projectFileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb("Error: Only JPEG and PNG images are allowed!");
    }
};

const projectUpload = multer({
    storage: projectStorage,
    fileFilter: projectFileFilter,
});

export default projectUpload;
