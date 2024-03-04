const mongoose = require("mongoose");
const mongoURI = "mongodb://localhost:27017/carnet";

const connectToMongo = async () => {
  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`Connected to Mongo: ${conn.connection.host}`);
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = connectToMongo;
