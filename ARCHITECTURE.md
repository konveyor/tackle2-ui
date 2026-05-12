# Architecture Documentation - tackle2-ui

## Overview

The tackle2-ui is a React-based web application that serves as the user interface for the Konveyor application modernization platform. It provides a modern, responsive interface for managing application assessments, migrations, and analysis workflows.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        tackle2-ui                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     Client      │  │     Server      │  │     Common      │ │
│  │   (React App)   │  │  (Express.js)   │  │   (Shared)      │ │
│  │                 │  │                 │  │                 │ │
│  │ - UI Components │  │ - Proxy Server  │  │ - Utilities     │ │
│  │ - State Mgmt    │  │ - Static Files  │  │ - Types         │ │
│  │ - Routing       │  │ - Dev Server    │  │ - Constants     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Konveyor Backend Services                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Tackle Hub  │  │  Keycloak   │  │ LLM Proxy   │  │   ...    │ │
│  │   (API)     │  │   (Auth)    │  │    (AI)     │  │          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

### Workspace Organization

The project uses npm workspaces to organize code into logical modules:

```
tackle2-ui/
├── client/          # React frontend application
├── server/          # Express.js proxy server
├── common/          # Shared utilities and types
├── cypress/         # End-to-end testing
├── .github/         # GitHub Actions workflows
├── docs/            # Additional documentation
├── hack/            # Development and deployment scripts
└── scripts/         # Build and utility scripts
```

### Client Architecture

The client application follows modern React patterns and conventions:

```
client/src/
├── app/
│   ├── App.tsx              # Root application component
│   ├── AppRoutes.tsx        # Application routing configuration
│   └── index.tsx            # Application entry point
├── components/
│   ├── shared/              # Reusable UI components
│   ├── tables/              # Table components and utilities
│   └── [feature]/           # Feature-specific components
├── hooks/
│   ├── useLocalStorage.ts   # Local storage hook
│   ├── useFetch.ts          # Data fetching utilities
│   └── [feature]/           # Feature-specific hooks
├── pages/
│   ├── applications/        # Application management
│   ├── dependencies/        # Dependency analysis
│   ├── reports/             # Reporting interface
│   └── [feature]/           # Other feature pages
├── queries/
│   ├── applications.ts      # Application API queries
│   ├── assessments.ts       # Assessment API queries
│   └── [entity].ts          # Entity-specific queries
├── shared/
│   ├── types.ts             # TypeScript type definitions
│   ├── constants.ts         # Application constants
│   └── utils.ts             # Utility functions
└── test-utils/
    ├── test-utils.tsx       # Testing utilities
    └── mocks/               # Mock data for testing
```

## Technology Stack

### Frontend Technologies

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Static type checking and enhanced developer experience
- **PatternFly**: Red Hat's open source design system
- **React Router**: Client-side routing
- **React Query (TanStack Query)**: Server state management and caching
- **i18next**: Internationalization framework
- **Axios**: HTTP client for API communication

### Development Tools

- **Vite**: Fast build tool and development server
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing utilities
- **Cypress**: End-to-end testing framework
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates

### Build and Deployment

- **Rollup**: Module bundler for production builds
- **Docker**: Containerization for deployment
- **GitHub Actions**: CI/CD pipeline automation
- **npm Workspaces**: Monorepo package management

## Data Flow Architecture

### State Management Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local State   │    │  Server State   │    │  Global State   │
│    (useState)   │    │ (React Query)   │    │   (Context)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - Form inputs   │    │ - API data      │    │ - User auth     │
│ - UI toggles    │    │ - Cache mgmt    │    │ - App settings  │
│ - Modal states  │    │ - Optimistic UI │    │ - Notifications │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### API Communication

```
Client Components
       │
       ▼
React Query Hooks
       │
       ▼ 
API Client Functions
       │
       ▼
Server Proxy (Express)
       │
       ▼
Konveyor Backend APIs
```

## Security Architecture

### Authentication Flow

1. User accesses application
2. Redirect to Keycloak for authentication
3. Keycloak returns JWT token
4. Client stores token securely
5. Token included in API requests
6. Server validates token with Keycloak

### Security Measures

- **CSP (Content Security Policy)**: Configured via headers
- **CORS**: Properly configured for cross-origin requests
- **Token Management**: Secure storage and automatic refresh
- **Input Validation**: Client and server-side validation
- **Dependency Scanning**: Automated vulnerability detection

## Performance Architecture

### Optimization Strategies

1. **Code Splitting**: Lazy loading of route components
2. **Bundle Optimization**: Tree shaking and minification
3. **Caching Strategy**: React Query for server state caching
4. **Image Optimization**: Compressed assets and lazy loading
5. **Memoization**: React.memo and useMemo for expensive operations

### Performance Monitoring

- Bundle size analysis with webpack-bundle-analyzer
- Core Web Vitals tracking
- React DevTools profiling
- Lighthouse audits in CI

## Testing Architecture

### Testing Strategy

```
┌─────────────────┐
│   Unit Tests    │  ← Jest + React Testing Library
├─────────────────┤
│Integration Tests│  ← React Testing Library + MSW
├─────────────────┤
│   E2E Tests     │  ← Cypress
├─────────────────┤
│ Visual Testing  │  ← Storybook (future)
└─────────────────┘
```

### Test Organization

- **Unit Tests**: Co-located with source files
- **Integration Tests**: Feature-level testing
- **E2E Tests**: User journey testing with Cypress
- **Mock Strategy**: MSW for API mocking

## Development Architecture

### Development Environment

The development setup supports hot reloading and efficient development:

```
Development Services:
├── Port 3001: Client (Vite dev server)
├── Port 3000: Server (Express proxy)
├── Port 9001: Keycloak (kubectl port-forward)
├── Port 9002: Tackle Hub API (kubectl port-forward)
└── Port 9004: LLM Proxy (kubectl port-forward)
```

### Build Process

1. **Common Module**: Built first, provides shared utilities
2. **Client Build**: Vite builds React application
3. **Server Build**: Rollup builds Express server
4. **Container Build**: Docker builds deployment image

## Deployment Architecture

### Container Strategy

```dockerfile
# Multi-stage build
FROM node:22 AS builder
# Build application

FROM registry.access.redhat.com/ubi9/ubi-minimal
# Runtime environment
```

### Deployment Patterns

- **Development**: Local minikube cluster
- **Testing**: Kubernetes test environments
- **Production**: OpenShift/Kubernetes clusters

## Integration Points

### External Service Integration

1. **Tackle Hub API**: Core application management
2. **Keycloak**: Authentication and authorization
3. **LLM Proxy**: AI/ML service integration
4. **Storage Services**: File uploads and downloads

### API Design Patterns

- RESTful API consumption
- GraphQL support (future consideration)
- WebSocket connections for real-time updates
- Pagination and filtering patterns

## Scalability Considerations

### Frontend Scalability

- Lazy loading for route components
- Virtual scrolling for large datasets
- Pagination for data tables
- Image optimization and caching

### Performance Budgets

- JavaScript bundle size < 500KB gzipped
- First Contentful Paint < 2s
- Largest Contentful Paint < 4s
- Cumulative Layout Shift < 0.1

## Monitoring and Observability

### Client-Side Monitoring

- Error boundary implementation
- Performance metrics collection
- User interaction tracking
- Bundle size monitoring

### Logging Strategy

- Structured logging in development
- Error reporting to monitoring systems
- Performance metrics collection
- User analytics (privacy-compliant)

## Future Architecture Considerations

### Planned Enhancements

1. **Micro-frontend Architecture**: Potential module federation
2. **Progressive Web App**: Service worker implementation
3. **Advanced Caching**: IndexedDB for offline capabilities
4. **Real-time Features**: WebSocket integration
5. **AI Integration**: Enhanced LLM proxy integration

### Migration Strategies

- Gradual TypeScript adoption
- Component library standardization
- State management modernization
- Testing framework updates

---

This architecture documentation serves as a living document that evolves with the project. For implementation details, refer to the code comments and inline documentation.
