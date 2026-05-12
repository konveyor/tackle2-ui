# Contributing to tackle2-ui

Thank you for your interest in contributing to the Konveyor tackle2-ui project! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to the Kubernetes Community Code of Conduct. By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js >= 22.22.0
- npm ^9.5.0 || ^10.5.2 || >=11
- Git
- kubectl (for local Kubernetes development)
- minikube (optional, for local testing)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/tackle2-ui.git
   cd tackle2-ui
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/konveyor/tackle2-ui.git
   ```

### Environment Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build common modules:
   ```bash
   npm run build -w common
   ```

3. Start development environment:
   ```bash
   npm run start:dev
   ```

This starts the development servers for:
- Common module (shared utilities)
- Server (Express proxy server)
- Client (React application)

## Development Workflow

### Branch Strategy

- `main` - Primary development branch
- `release-x.x` - Release branches for specific versions
- Feature branches should be created from `main`

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Test your changes:
   ```bash
   npm test
   npm run test:e2e
   ```

4. Format and lint your code:
   ```bash
   npm run format
   npm run lint:fix
   ```

5. Commit your changes with a descriptive message:
   ```bash
   git commit -m "feat: add new feature description"
   ```

### Commit Message Convention

We use conventional commit format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Prefer functional components with hooks
- Use proper TypeScript types (avoid `any`)

### React Components

- Use PascalCase for component names
- Place components in appropriate directories under `client/src/`
- Use React hooks for state management
- Follow PatternFly design system guidelines
- Write unit tests for components

### File Organization

```
client/src/
├── app/          # Application-wide components and routing
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── pages/        # Page-level components
├── queries/      # React Query hooks
├── shared/       # Shared utilities and types
└── test-utils/   # Testing utilities
```

### Styling

- Use PatternFly components when possible
- Follow existing CSS-in-JS patterns
- Maintain responsive design principles
- Use semantic CSS class names

## Testing

### Unit Tests

Run unit tests with:
```bash
npm test
```

Test files should:
- Be co-located with source files (`*.test.ts`, `*.test.tsx`)
- Use Jest and React Testing Library
- Follow AAA pattern (Arrange, Act, Assert)
- Test behavior, not implementation

### End-to-End Tests

Run E2E tests with:
```bash
npm run test:e2e
```

E2E tests use Cypress and are located in the `cypress/` directory.

### Test Coverage

- Maintain test coverage above 80%
- Write tests for new features and bug fixes
- Include both positive and negative test cases

## Pull Request Process

### Before Submitting

1. Ensure all tests pass locally
2. Run linting and formatting checks
3. Update documentation if needed
4. Add appropriate labels to your PR

### PR Requirements

- Clear, descriptive title
- Detailed description of changes
- Reference related issues
- Include screenshots for UI changes
- Ensure CI checks pass

### Review Process

1. At least one reviewer approval required
2. All CI checks must pass
3. Address reviewer feedback promptly
4. Keep PR scope focused and manageable

### Merging

- Use "Squash and merge" for feature branches
- Maintain linear history on main branch
- Delete feature branches after merging

## Documentation

### Code Documentation

- Use JSDoc comments for functions and classes
- Include inline comments for complex logic
- Keep README and docs up to date
- Document breaking changes

### API Documentation

- Update OpenAPI specs for API changes
- Include examples in documentation
- Document error conditions and responses

## Community

### Getting Help

- GitHub Discussions for questions
- GitHub Issues for bug reports and feature requests
- Slack: #konveyor-dev channel

### Reporting Issues

When reporting bugs, include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)
- Console logs and error messages

### Feature Requests

For feature requests, provide:
- Use case description
- Proposed solution
- Alternative solutions considered
- Mockups or diagrams if applicable

## Release Process

Releases are managed by maintainers:

1. Version bump in `package.json`
2. Update CHANGELOG.md
3. Create release branch
4. Tag release
5. Build and publish container images

## Security

- Report security vulnerabilities privately
- Follow responsible disclosure practices
- Keep dependencies up to date
- Use security scanning tools

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to tackle2-ui! Your efforts help make application modernization more accessible to everyone.
