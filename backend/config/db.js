import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error(`MongoDB Connection Error`);
    
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('\n🔐 Authentication Failed! Please check:');
      console.error('   1. Your MongoDB Atlas username is correct');
      console.error('   2. Your MongoDB Atlas password is correct (replace <db_password> in .env)');
      console.error('   3. The database user has proper permissions');
      console.error('\n📝 To get your connection string:');
      console.error('   - Go to MongoDB Atlas → Clusters → Connect');
      console.error('   - Choose "Connect your application"');
      console.error('   - Copy the connection string and replace <password> with your actual password');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  MongoDB is not running!');
      console.error('   - If using local MongoDB: Run "mongod" or start MongoDB service');
      console.error('   - If using MongoDB Atlas: Check your connection string in .env');
    } else {
      console.error('\n⚠️  Connection failed!');
      console.error('   - Check your MONGODB_URI in .env file');
      console.error('   - Verify your MongoDB Atlas cluster is running');
    }
    console.error('');
    process.exit(1);
  }
};

export default connectDB;
