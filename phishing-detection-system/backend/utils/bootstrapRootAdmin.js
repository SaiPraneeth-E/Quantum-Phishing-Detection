const User = require('../models/User');

async function bootstrapRootAdmin() {
  const rootEmail = (process.env.ROOT_ADMIN_EMAIL || '').toLowerCase().trim();
  const rootPassword = process.env.ROOT_ADMIN_PASSWORD || '';
  const rootName = process.env.ROOT_ADMIN_NAME || 'Root Admin';

  if (!rootEmail || !rootPassword) {
    console.warn('Root admin bootstrap skipped. Set ROOT_ADMIN_EMAIL and ROOT_ADMIN_PASSWORD.');
    return;
  }

  const existing = await User.findOne({ email: rootEmail }).select('+password');
  if (!existing) {
    await User.create({
      name: rootName,
      email: rootEmail,
      password: rootPassword,
      role: 'admin',
    });
    console.log(`Root admin created: ${rootEmail}`);
    return;
  }

  if (existing.role !== 'admin') {
    existing.role = 'admin';
    await existing.save();
    console.log(`Root admin role enforced for: ${rootEmail}`);
  }
}

module.exports = bootstrapRootAdmin;

