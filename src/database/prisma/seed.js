'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@greenlight.com' },
    update: {},
    create: {
      email: 'superadmin@greenlight.com',
      firstName: 'Super',
      lastName: 'Admin',
      username: 'superadmin',
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@greenlight.com' },
    update: {},
    create: {
      email: 'admin@greenlight.com',
      firstName: 'System',
      lastName: 'Admin',
      username: 'sysadmin',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('Seeded users:', { superAdmin: superAdmin.email, admin: admin.email });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('Seed error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
