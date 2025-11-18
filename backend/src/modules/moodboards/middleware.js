import multer from "multer";
import path from "path";
import fs from "fs";

const moodboardStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "public/uploads/moodboards/";

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

const moodboardFileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/; // Allowed file types
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(
            "Error: File upload only supports the following filetypes - " +
                filetypes,
        );
    }
};

const moodboardUpload = multer({
    storage: moodboardStorage,
    // limits: {
    //     fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    // },
    fileFilter: moodboardFileFilter,
});

export default moodboardUpload;
