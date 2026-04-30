import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Club from '../models/Club.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

dotenv.config();

const seedClubs = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find a club coordinator
    const coordinatorRole = await Role.findOne({ name: 'Club Coordinator' });
    if (!coordinatorRole) {
      console.error('Club Coordinator role not found');
      process.exit(1);
    }

    const coordinator = await User.findOne({ role: coordinatorRole._id });
    if (!coordinator) {
      console.error('No Club Coordinator user found');
      process.exit(1);
    }

    console.log(`Using coordinator: ${coordinator.name} (${coordinator.coordinatorId})`);

    // Sample clubs data
    const clubsData = [
      // Technical Clubs
      { name: 'Coding Club', description: 'Learn programming and software development', type: 'Technical' },
      { name: 'Robotics Club', description: 'Build and program robots', type: 'Technical' },
      { name: 'AI & ML Club', description: 'Explore artificial intelligence and machine learning', type: 'Technical' },
      
      // Cultural Clubs
      { name: 'Music Club', description: 'Learn and perform various musical instruments', type: 'Cultural' },
      { name: 'Dance Club', description: 'Practice different dance forms', type: 'Cultural' },
      { name: 'Drama Club', description: 'Theater and acting performances', type: 'Cultural' },
      
      // Sports Clubs
      { name: 'Basketball Club', description: 'Play and compete in basketball', type: 'Sports' },
      { name: 'Cricket Club', description: 'Cricket practice and tournaments', type: 'Sports' },
      { name: 'Football Club', description: 'Football training and matches', type: 'Sports' }
    ];

    // Delete existing clubs (optional - comment out if you want to keep existing clubs)
    await Club.deleteMany({});
    console.log('Cleared existing clubs');

    // Create clubs
    for (const clubData of clubsData) {
      const existingClub = await Club.findOne({ name: clubData.name });
      if (!existingClub) {
        await Club.create({
          ...clubData,
          coordinator: coordinator._id,
          members: [],
          events: []
        });
        console.log(`✓ Created club: ${clubData.name} (${clubData.type})`);
      } else {
        console.log(`- Club already exists: ${clubData.name}`);
      }
    }

    console.log('\n✅ Clubs seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding clubs:', error);
    process.exit(1);
  }
};

seedClubs();

// Made with Bob
