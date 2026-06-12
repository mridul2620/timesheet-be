const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set env vars before requiring app
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.SESSION_SECRET = 'test_session_secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_dummy'; // Will be overridden by MongoMemoryServer

const app = require('../app');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri);

    // Create a test user
    const testUser = new User({
        username: 'testuser',
        email: ['testuser@example.com'],
        name: 'Test User',
        role: 'user',
        active: true,
        allocatedHours: [],
        financialYears: []
    });

    await User.register(testUser, 'password123');
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('JWT Authentication Flow', () => {
    let accessToken;
    let refreshTokenCookie;

    test('1. Login Test: Should return access token and set refresh token cookie', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({
                username: 'testuser',
                password: 'password123'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.accessToken).toBeDefined();

        // Check if cookie is set
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
        expect(refreshCookie).toBeDefined();
        expect(refreshCookie).toContain('HttpOnly');
        expect(refreshCookie).toContain('Path=/');

        accessToken = response.body.accessToken;
        refreshTokenCookie = refreshCookie.split(';')[0]; // Save just the key=value part for future requests

        // Verify token is saved in DB
        const user = await User.findOne({ username: 'testuser' });
        expect(user.refreshTokens).toHaveLength(1);
    });

    test('2. Invalid Login Test: Should return 401', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({
                username: 'testuser',
                password: 'wrongpassword'
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test('3. Refresh Token Test: Should generate new access token', async () => {
        const response = await request(app)
            .post('/api/refresh')
            .set('Cookie', [refreshTokenCookie]);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.accessToken).toBeDefined();
        
        accessToken = response.body.accessToken;
    });

    test('4. Access Token Verification: Should allow access with valid token', async () => {
        // We will test the /api/users endpoint which requires authentication
        const response = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
        // It might be 403 if roles don't match, or 200, but it shouldn't be 401. 
        // We know it reached the route if it's not 401.
    });

    test('5. Revocation Test (Logout): Should revoke refresh token', async () => {
        // 5a. Call logout
        const logoutResponse = await request(app)
            .post('/api/logout')
            .set('Cookie', [refreshTokenCookie]);

        expect(logoutResponse.status).toBe(200);
        
        // Check if cookie clearing header is sent
        const cookies = logoutResponse.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
        expect(refreshCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT'); // Standard clearCookie expiration

        // 5b. Verify token is removed from DB
        const user = await User.findOne({ username: 'testuser' });
        expect(user.refreshTokens).toHaveLength(0);

        // 5c. Try to refresh with the old (but cryptographically valid) token
        const refreshResponse = await request(app)
            .post('/api/refresh')
            .set('Cookie', [refreshTokenCookie]);

        expect(refreshResponse.status).toBe(403);
        expect(refreshResponse.body.message).toContain('revoked');
    });
});
