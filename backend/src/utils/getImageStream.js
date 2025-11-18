import fs from "fs";
import axios from "axios";
import path from "path";
import GalleryImage from "../modules/gallery/model.js";
import { generateFileHash } from "./otherUtils.js";

/**
 * Get image stream based on id, url, or uploaded file.
 *
 * @param {Object} opts
 * @param {string} [opts.galleryImageId] - If image is from gallery
 * @param {string} [opts.generatedImageUrl] - If image is generated
 * @param {Object} [opts.file] - Multer uploaded file (fallback)
 *
 * @returns {Promise<{ stream: ReadableStream, filename: string }>}
 */
export const getImageStream = async ({
    galleryImageId,
    generatedImageUrl,
    file,
}) => {
    // Case 1: Gallery image (find in DB, then stream from disk)
    if (galleryImageId) {
        const galleryImage = await GalleryImage.findById(galleryImageId);
        if (!galleryImage) throw new Error("Gallery image not found");

        // Convert stored URL back to a local path
        const localPath = path.join(
            "public",
            galleryImage.url.replace(`${process.env.BASE_URL}/`, ""),
        );

        if (fs.existsSync(localPath)) {
            return {
                stream: fs.createReadStream(localPath),
                filename: path.basename(localPath),
                filePath: localPath
            };
        }

        // If file doesn’t exist locally, fetch from remote URL (e.g. generated)
        const response = await axios.get(galleryImage.url, {
            responseType: "stream",
        });
        const filename = path.basename(new URL(galleryImage.url).pathname);

        return {
            stream: response.data,
            filename,
            filePath: galleryImage.url
        };
    }

    // Case 2: Generated image (fetch from URL and stream)
    if (generatedImageUrl) {
        console.log('case 2 hist, generatedImageUrl',generatedImageUrl)
        const response = await axios.get(generatedImageUrl, {
            responseType: "stream",
        });
        const filename = path.basename(new URL(generatedImageUrl).pathname);

        return {
            stream: response.data,
            filename,
            filePath: generatedImageUrl
        };
    }

    // Case 3: Uploaded file
    if (file) {
        return {
            stream: fs.createReadStream(file.path),
            filename: file.originalname,
            filePath: file.path
        };
    }

    throw new Error("No image source provided");
};
