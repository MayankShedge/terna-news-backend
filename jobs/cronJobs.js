const cron = require('node-cron');
const News = require('../models/News');
const User = require('../models/User');
const { sendNewsletterEmail } = require('../utils/sendEmail');

// 1️⃣ Weekly Newsletter - Every Monday 8 AM
const sendWeeklyNewsletter = async () => {
    try {
        console.log('📰 Running weekly newsletter cron job...');
        
        // Get articles from last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weeklyArticles = await News.find({
            createdAt: { $gte: oneWeekAgo }
        })
        .sort({ createdAt: -1 })
        .limit(5);
        
        if (weeklyArticles.length === 0) {
            console.log('✅ No articles published this week. Skipping newsletter.');
            return;
        }
        
        // Get all verified users
        const subscribers = await User.find({ isVerified: true });
        
        if (subscribers.length === 0) {
            console.log('✅ No verified users to send newsletter.');
            return;
        }
        
        console.log(`📬 Sending newsletter to ${subscribers.length} subscribers...`);
        
        // Send newsletter to each user
        for (const user of subscribers) {
            try {
                await sendNewsletterEmail(user.email, user.name, weeklyArticles);
                console.log(`✅ Newsletter sent to ${user.email}`);
            } catch (error) {
                console.error(`❌ Failed to send newsletter to ${user.email}:`, error.message);
            }
        }
        
        console.log('✅ Weekly newsletter completed!');
        
    } catch (error) {
        console.error('❌ Error in weekly newsletter cron job:', error);
    }
};

// 2️⃣ Database Cleanup - Every Sunday Midnight
const cleanupUnverifiedUsers = async () => {
    try {
        console.log('🗑️ Running database cleanup cron job...');
        
        // Delete users who registered 7+ days ago but never verified
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const result = await User.deleteMany({
            isVerified: false,
            createdAt: { $lt: sevenDaysAgo }
        });
        
        if (result.deletedCount > 0) {
            console.log(`✅ Deleted ${result.deletedCount} unverified user(s).`);
        } else {
            console.log('✅ No unverified users to delete.');
        }
        
    } catch (error) {
        console.error('❌ Error in database cleanup cron job:', error);
    }
};

// Initialize cron jobs
const initCronJobs = () => {
    // Weekly newsletter - Every Monday at 8:00 AM IST
    cron.schedule('0 8 * * 1', sendWeeklyNewsletter, {
        timezone: "Asia/Kolkata"
    });
    
    // Database cleanup - Every Sunday at 12:00 AM IST
    cron.schedule('0 0 * * 0', cleanupUnverifiedUsers, {
        timezone: "Asia/Kolkata"
    });
    
    console.log('📅 Cron jobs initialized!');
    console.log('   - Weekly newsletter: Every Monday at 8:00 AM IST');
    console.log('   - Database cleanup: Every Sunday at 12:00 AM IST');
};

// Export for manual testing
module.exports = {
    initCronJobs,
    sendWeeklyNewsletter,
    cleanupUnverifiedUsers
};