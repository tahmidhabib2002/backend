const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    });
    console.log(`MongoDB Connected! Host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Failure: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;