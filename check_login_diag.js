const mongoose = require('mongoose');
const User = require('./model/user');

const MONGODB_URL = "mongodb+srv://chikaonyema:zvXhaO8kQwBtZxlj@investcluster.dbmuoje.mongodb.net/?appName=InvestCluster";

async function checkUsers() {
    try {
        await mongoose.connect(MONGODB_URL);
        
        // Find all users and check their 2FA & blocked status
        const users = await User.find({}, 'firstName email isAdmin isBlocked isTwoFactorEnabled');
        
        console.log('--- USER LOGIN STATUS ---');
        users.forEach(u => {
            console.log(`[${u.email}]`);
            console.log(`  Admin: ${u.isAdmin}, Blocked: ${u.isBlocked}, 2FA Enabled: ${u.isTwoFactorEnabled}`);
        });

    } catch (err) {
        console.error('Diagnostic Failed:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
