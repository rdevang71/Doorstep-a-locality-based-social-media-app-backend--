import mongoose from "mongoose";
import dns from "node:dns";

const isDnsResolutionError = (error) =>
  ["ECONNREFUSED", "ETIMEOUT", "SERVFAIL"].includes(error?.code) &&
  error?.syscall === "querySrv";

export const connectDB = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured");

  let connection;
  try {
    connection = await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    if (!isDnsResolutionError(error)) throw error;

    // Some Windows DNS configurations resolve normally but refuse the SRV
    // queries used by mongodb+srv. Retry through known public DNS resolvers.
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
    connection = await mongoose.connect(process.env.MONGO_URI);
  }

  console.log(`MongoDB connected: ${connection.connection.host}`);
};
