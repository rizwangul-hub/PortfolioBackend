import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.cloudinary_cloud_name;
const CLOUDINARY_API_KEY =
  process.env.CLOUDINARY_API_KEY || process.env.cloudinary_api_key;
const CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET || process.env.cloudinary_api_secret;

const CLOUDINARY_CONFIGURED = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET,
);

if (CLOUDINARY_CONFIGURED) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "⚠️  Cloudinary env vars are not fully set. Uploads will fail until configured.",
  );
}

// Configure Multer in-memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

export const uploadToCloudinary = async (fileBuffer) => {
  if (!CLOUDINARY_CONFIGURED) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "portfolio_projects",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      },
    );

    uploadStream.end(fileBuffer);
  });
};
