import { config } from 'dotenv';

// Load test environment variables
config({ path: '../.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/notria_test';

// Global test setup
beforeAll(async () => {
  // Setup database connection for tests
  // This would be implemented with a test database setup
});

afterAll(async () => {
  // Cleanup after all tests
  // Close database connections, etc.
});
