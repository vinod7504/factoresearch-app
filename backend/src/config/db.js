const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env");
  }

  const options = {};
  if (process.env.DB_NAME) {
    options.dbName = process.env.DB_NAME;
  }

  await mongoose.connect(uri, options);
  console.log("MongoDB connected");
};

module.exports = connectDB;
