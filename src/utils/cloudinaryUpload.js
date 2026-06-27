import { Blob } from "node:buffer";
import crypto from "node:crypto";
import { cloudinaryCredentials, isCloudinaryConfigured } from "../config/cloudinary.js";

const signUpload = (params, apiSecret) => {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(payload + apiSecret).digest("hex");
};

const cloudinaryErrorMessage = async (response) => {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    return payload.error?.message || text;
  } catch {
    return text || response.statusText;
  }
};

export default async function uploadImageBuffer(file, { folder }) {
  if (!isCloudinaryConfigured()) {
    const e = new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
    e.status = 500;
    throw e;
  }

  const { cloudName, apiKey, apiSecret } = cloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = signUpload(params, apiSecret);
  const body = new FormData();
  body.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname || "upload");
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const e = new Error(`Cloudinary upload failed (${response.status}): ${await cloudinaryErrorMessage(response)}`);
    e.status = 502;
    throw e;
  }

  const result = await response.json();
  if (!result.secure_url) {
    const e = new Error("Cloudinary upload succeeded but did not return a secure_url.");
    e.status = 502;
    throw e;
  }
  return result.secure_url;
}
