import fs from "fs";
import crypto from "crypto";
import User from '../modules/users/model.js'; // adjust path to your User model

export const isAdmin = async (userId) => {
  if (!userId) return false;

  const user = await User.findById(userId).select('email');
  if (!user) return false;

  return user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();
};



// /**
//  * Generates an MD5 hash for the given file path.
//  * @param {string} filePath - Absolute or relative path to the file.
//  * @returns {string} The MD5 hash of the file.
//  */
//   export const generateFileHash = (filePath) => {
//     console.log("filePath", filePath);
//     const fileBuffer = fs.readFileSync(filePath);
//     const hashSum = crypto.createHash("md5");
//     hashSum.update(fileBuffer);
//     const hash = hashSum.digest("hex");
//     console.log("hashjghjsghjdghjdgh", hash);
//     return hash
//   };


import axios from "axios";

export const generateFileHash = async (filePath) => {
  try {
    let fileBuffer;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      // Remote file
      console.log("Fetching remote file:", filePath);
      const response = await axios.get(filePath, { responseType: "arraybuffer" });
      fileBuffer = Buffer.from(response.data);
    } else {
      // Local file
      console.log("Reading local file:", filePath);
      fileBuffer = fs.readFileSync(filePath);
    }

    const hashSum = crypto.createHash("md5");
    hashSum.update(fileBuffer);
    const hash = hashSum.digest("hex");

    console.log("Generated hash:", hash);
    return hash;
  } catch (err) {
    console.error(`Failed to generate fileHash for ${filePath}:`, err.message);
    throw err;
  }
};



export const  getPasswordValidationMessage = (password)=> {
  if (password.length < 8) {
    return "At least 8 characters in password";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "At least 1 special character in password";
  }
  if (!/\d/.test(password)) {
    return "At least 1 number in password";
  }
  if (!/[A-Z]/.test(password)) {
    return "At least 1 capital letter in password";
  }

  return null; 
}
