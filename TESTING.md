# Testing Guide for Academix

This project includes comprehensive unit and integration testing for both backend and frontend.

## Backend Testing

Backend tests are run using **Jest** with **Supertest** for API testing and **MongoDB Memory Server** for integration tests.

### Installation

```bash
cd backend
npm install
```

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- `__tests__/unit/` - Unit tests for models, utilities, and middleware
  - `models/User.test.js` - User model schema validation
  - `utils/generateToken.test.js` - Token generation utility tests
  
- `__tests__/integration/` - Integration tests
  - `auth.integration.test.js` - Authentication API integration tests

### Test Coverage Goals

- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Frontend Testing

Frontend tests are run using **Vitest** with **React Testing Library** for component testing.

### Installation

```bash
cd frontend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (interactive)
npm test -- --watch

# View test coverage
npm run coverage

# Open UI test dashboard
npm run test:ui
```

### Test Structure

- `src/__tests__/setup.js` - Test configuration and mocks
- `src/__tests__/context/` - Context tests
  - `AuthContext.test.jsx` - Authentication context tests
  
- `src/__tests__/components/` - Component tests
  - `ProtectedRoute.test.jsx` - Protected route component tests
  
- `src/__tests__/pages/` - Page component tests
  - `Home.test.jsx` - Home page tests
  
- `src/__tests__/utils/` - Utility function tests
  - `helpers.test.js` - Helper function tests

### Test Coverage Goals

- Aim for 50%+ coverage on all metrics
- Functions critical to user experience should have 80%+ coverage

## Writing Tests

### Backend Test Example

```javascript
import request from 'supertest';
import app from '../server.js';

describe('API Endpoint', () => {
  it('should return 200 status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
```

### Frontend Test Example

```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render text', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test
```

## Best Practices

1. **Test Coverage**: Aim for at least 50% coverage, higher for critical paths
2. **Naming**: Use clear, descriptive test names that explain what is being tested
3. **Isolation**: Each test should be independent and not rely on others
4. **Cleanup**: Clean up resources (databases, mocks, etc.) after tests
5. **Mocking**: Mock external dependencies (APIs, databases) to keep tests fast
6. **Assertions**: Use clear assertions that provide meaningful error messages

## Troubleshooting

### Backend Tests Failing

- Ensure MongoDB is available (tests use in-memory database)
- Check that all environment variables are set in `.env`
- Clear Jest cache: `npm test -- --clearCache`

### Frontend Tests Failing

- Check that React Router is properly set up in tests
- Ensure mocks are applied before component rendering
- Use `screen.debug()` to inspect rendered output

## Further Reading

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Documentation](https://testing-library.com/react)
