import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { config } from "../../config/AppProperties.js";

export const storage = multer.memoryStorage();

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

// File filter to accept only certain image types
const fileFilter = (req, file, cb) => {
  const validTypes = /jpeg|png|gif|svg/;
  const isValid = validTypes.test(file.mimetype);

  if (isValid) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG,  PNG, SVG and Gif are allowed."),
      false
    );
  }
};

const upload = multer({ storage, fileFilter });

const uploadMultipleBuffers = async (files) => {
  const uploadedImageIds = [];

  try {
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        let cld_upload_stream = cloudinary.uploader.upload_stream(
          {
            folder: "ecom_assess_content",
          },
          (error, result) => {
            if (result) {
              uploadedImageIds.push(result.public_id);
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(file.buffer).pipe(cld_upload_stream);
      });
    });
    const results = await Promise.all(uploadPromises);

    return results;
  } catch (error) {
    if (uploadedImageIds.length > 0) {
      await Promise.all(
        uploadedImageIds.map((public_id) =>
          cloudinary.uploader.destroy(public_id)
        )
      );
    }

    throw new Error(
      "Upload failed. All uploaded images have been rolled back."
    );
  }
};

const deleteImageFromCloud = async (path) => {
  try {
    await cloudinary.uploader.destroy(path);
    return null;
  } catch (error) {
    return null;
  }
};

export { upload, uploadMultipleBuffers, deleteImageFromCloud };
