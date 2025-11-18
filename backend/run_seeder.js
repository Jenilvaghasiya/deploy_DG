import { seedAll } from './src/seeders/index.js';
import connectMongoDB from './src/config/database.js';
import mongoose from 'mongoose';

const runSeeders = async () => {
    try {
        // Connect to MongoDB
        await connectMongoDB();
        console.log('MongoDB connected');

        // Run the seeders
        await seedAll();
        console.log('All seeders ran successfully (existing data was skipped to avoid duplication).');

        // Exit the process
        process.exit(0);
    } catch (error) {
        console.error('Error running seeders:', error);
        process.exit(1);
    }
};

runSeeders();