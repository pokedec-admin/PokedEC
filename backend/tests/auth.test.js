const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock dependencies
const mockPool = {
  query: jest.fn()
};

// Mock twoFactor utility to avoid loading otplib/qrcode
jest.mock('../src/utils/twoFactor', () => ({
  generateTwoFactorSecret: jest.fn(),
  generateQrCode: jest.fn(),
  verifyTwoFactorToken: jest.fn()
}));

// Mock auth middleware
jest.mock('../src/middleware/auth', () => ({
  authenticateToken: (req, res, next) => next(),
  authenticateAdmin: (req, res, next) => next(),
  syncUsers: jest.fn(),
  supabase: {}
}));

const app = express();
app.use(bodyParser.json());
app.locals.pool = mockPool;

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      identify: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      refreshSession: jest.fn(),
      admin: {
        listUsers: jest.fn(),
        updateUserById: jest.fn()
      }
    }
  }))
}));

const { router: authRouter } = require('../src/routes/auth');
app.use('/api/auth', authRouter);

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if user not found on identify', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/auth/identify')
      .send({ identifier: 'nonexistent@example.com' });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('User not found locally');
  });

  it('should return 200 and email if user found on identify', async () => {
    mockPool.query.mockResolvedValueOnce({ 
      rows: [{ email: 'test@example.com' }] 
    });

    const response = await request(app)
      .post('/api/auth/identify')
      .send({ identifier: 'test' });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('test@example.com');
  });
});
