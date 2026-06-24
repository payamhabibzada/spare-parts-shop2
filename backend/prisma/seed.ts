/**
 * Prisma Database Seeder
 * Seeds initial data for development and testing
 *
 * Run: pnpm db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo shop user
  const shopUser = await prisma.shopUser.upsert({
    where: { email: 'demo@shopmanagement.com' },
    update: {},
    create: {
      name: 'Demo Shop Owner',
      email: 'demo@shopmanagement.com',
      passwordHash: await bcrypt.hash('Demo123!@#', 12),
      phone: '+93 700 000 000',
      shopName: 'Demo Shop',
      isActive: true,
    },
  });

  console.log('✅ Created demo shop user:', shopUser.email);

  // Create admin user for the shop
  const adminUser = await prisma.user.upsert({
    where: {
      shopId_username: {
        shopId: shopUser.id,
        username: 'admin',
      },
    },
    update: {},
    create: {
      shopId: shopUser.id,
      username: 'admin',
      email: 'admin@demoshop.com',
      passwordHash: await bcrypt.hash('Admin123!@#', 12),
      fullName: 'Shop Administrator',
      role: 'ADMIN',
      isActive: true,
      permissions: [
        'products:read',
        'products:write',
        'customers:read',
        'customers:write',
        'sales:read',
        'sales:write',
        'reports:read',
        'users:read',
        'users:write',
      ],
    },
  });

  console.log('✅ Created admin user:', adminUser.username);

  // Create regular user for the shop
  const regularUser = await prisma.user.upsert({
    where: {
      shopId_username: {
        shopId: shopUser.id,
        username: 'user1',
      },
    },
    update: {},
    create: {
      shopId: shopUser.id,
      username: 'user1',
      email: 'user1@demoshop.com',
      passwordHash: await bcrypt.hash('User123!@#', 12),
      fullName: 'Regular User',
      role: 'USER',
      isActive: true,
      permissions: ['products:read', 'customers:read', 'sales:read'],
    },
  });

  console.log('✅ Created regular user:', regularUser.username);

  // Create cash ledger
  const cashLedger = await prisma.cashLedger.upsert({
    where: { shopId: shopUser.id },
    update: {},
    create: {
      shopId: shopUser.id,
      balanceAfn: 100000,
      balanceUsd: 1000,
    },
  });

  console.log('✅ Created cash ledger');

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        shopId: shopUser.id,
        nameEn: 'Electronics',
        nameFa: 'الکترونیک',
        description: 'Electronic devices and accessories',
      },
    }),
    prisma.category.create({
      data: {
        shopId: shopUser.id,
        nameEn: 'Clothing',
        nameFa: 'پوشاک',
        description: 'Clothing and fashion items',
      },
    }),
    prisma.category.create({
      data: {
        shopId: shopUser.id,
        nameEn: 'Food',
        nameFa: 'مواد غذایی',
        description: 'Food and beverages',
      },
    }),
  ]);

  console.log(\`✅ Created \${categories.length} categories\`);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Demo Credentials:');
  console.log('  Shop Owner:');
  console.log('    Email: demo@shopmanagement.com');
  console.log('    Password: Demo123!@#');
  console.log('');
  console.log('  Admin User:');
  console.log('    Username: admin');
  console.log('    Password: Admin123!@#');
  console.log('');
  console.log('  Regular User:');
  console.log('    Username: user1');
  console.log('    Password: User123!@#');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
