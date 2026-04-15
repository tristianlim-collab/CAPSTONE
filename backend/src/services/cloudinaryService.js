import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBufferToCloudinary = async (buffer, folder = "gaoirs/evidence") => {
  if (!buffer) return null;
  const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64, { folder });
  return result.secure_url;
};

export default cloudinary;