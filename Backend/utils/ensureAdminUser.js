const User = require('../Model/UserModel');

const ADMIN_EMAIL = 'admin111@gmail.com';
const ADMIN_PASSWORD = 'Admin111*';

async function ensureAdminUser() {
    try {
        let user = await User.findOne({ email: ADMIN_EMAIL });
        if (!user) {
            await User.create({
                name: 'Administrator',
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                role: 'admin',
            });
            console.log(`Admin user created: ${ADMIN_EMAIL}`);
            return;
        }
        let changed = false;
        if (user.role !== 'admin') {
            user.role = 'admin';
            changed = true;
        }
        if (user.password !== ADMIN_PASSWORD) {
            user.password = ADMIN_PASSWORD;
            changed = true;
        }
        if (changed) {
            await user.save();
            console.log(`Admin user updated (role/password): ${ADMIN_EMAIL}`);
        }
    } catch (err) {
        console.error('ensureAdminUser failed:', err?.message || err);
    }
}

module.exports = { ensureAdminUser, ADMIN_EMAIL };
