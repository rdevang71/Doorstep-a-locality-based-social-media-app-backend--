import { v2 as cloudinary } from "cloudinary";

const env = (key) => process.env[key]?.trim();

cloudinary.config({
  cloud_name: env("CLOUDINARY_CLOUD_NAME"),
  api_key: env("CLOUDINARY_API_KEY"),
  api_secret: env("CLOUDINARY_API_SECRET"),
  secure: true,
});

export const cloudinaryCredentials = () => ({
  cloudName: env("CLOUDINARY_CLOUD_NAME"),
  apiKey: env("CLOUDINARY_API_KEY"),
  apiSecret: env("CLOUDINARY_API_SECRET"),
});

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = cloudinaryCredentials();
  return Boolean(cloudName && apiKey && apiSecret);
};

export default cloudinary;
