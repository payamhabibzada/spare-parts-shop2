/**
 * Authentication Tests
 * Test JWT authentication, login, and user management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';

const prisma = new PrismaClient();

describe('Authentication', () => {
  let testShopId: string;

  beforeAll(async () => {
    // Create test shop
    const shop = await prisma.shopUser.create({
      data: {
        name: 'Test Shop',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('Test123!@#', 12),
        phone: '1234567890',
        shopName: 'Test Shop',
      },
    });
    testShopId = shop.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.shopUser.deleteMany({ where: { id: testShopId } });
    await prisma.$disconnect();
  });

  describe('Password Hashing', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 12);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 12);
      const isValid = await bcrypt.compare(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 12);
      const isValid = await bcrypt.compare('WrongPassword', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    it('should generate access token', () => {
      const payload = {
        shopId: testShopId,
        userId: 'user-id',
        role: 'USER' as const,
      };

      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });

    it('should generate refresh token', () => {
      const payload = {
        shopId: testShopId,
        userId: 'user-id',
      };

      const token = generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });
  });

  describe('Database Operations', () => {
    it('should create user with unique email', async () => {
      const user = await prisma.user.create({
        data: {
          shopId: testShopId,
          username: 'testuser',
          email: 'user@test.com',
          passwordHash: await bcrypt.hash('Test123!', 12),
          fullName: 'Test User',
          role: 'USER',
        },
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('user@test.com');

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should enforce unique email constraint', async () => {
      await prisma.user.create({
        data: {
          shopId: testShopId,
          username: 'user1',
          email: 'duplicate@test.com',
          passwordHash: await bcrypt.hash('Test123!', 12),
          fullName: 'User One',
          role: 'USER',
        },
      });

      await expect(
        prisma.user.create({
          data: {
            shopId: testShopId,
            username: 'user2',
            email: 'duplicate@test.com', // Same email
            passwordHash: await bcrypt.hash('Test123!', 12),
            fullName: 'User Two',
            role: 'USER',
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.user.deleteMany({ where: { email: 'duplicate@test.com' } });
    });
  });
});
