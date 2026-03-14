const Role = require('../models/Role.model');

const defaultRoles = [
    { name: 'super_admin', displayName: 'Owner', rank: 1, description: 'Platform Owner / Business Founder' },
    { name: 'tenant_admin', displayName: 'Admin', rank: 2, description: 'Business Administrator' },
    { name: 'dashboard', displayName: 'Dashboard', rank: 2.5, description: 'Dashboard Operator' },
    { name: 'manager', displayName: 'Manager', rank: 3, description: 'Team Manager' },
    { name: 'staff', displayName: 'Staff', rank: 4, description: 'Service Provider / Staff Member' },
    { name: 'customer', displayName: 'Customer', rank: 5, description: 'End User / Client' }
];

const seedRoles = async () => {
    try {
        const User = require('../models/User.model');
        const roleMap = {};

        for (const roleData of defaultRoles) {
            const role = await Role.findOneAndUpdate(
                { name: roleData.name },
                roleData,
                { upsert: true, returnDocument: 'after' }
            );
            roleMap[roleData.name] = role._id;
        }
        console.log('✅ Roles seeded successfully');

        // Migration logic: Use raw collection to bypass Mongoose schema validation (CastErrors)
        const users = await User.collection.find({}).toArray();
        let migratedCount = 0;

        for (const user of users) {
            // Check if role is a string (legacy data)
            if (typeof user.role === 'string' && roleMap[user.role]) {
                await User.collection.updateOne(
                    { _id: user._id },
                    { $set: { role: roleMap[user.role] } }
                );
                migratedCount++;
            }
        }

        if (migratedCount > 0) {
            console.log(`🚀 Migrated ${migratedCount} users from string roles to ObjectIds using raw collection update`);
        }
        
    } catch (error) {
        console.error('❌ Error seeding/migrating roles:', error);
    }
};

module.exports = seedRoles;
