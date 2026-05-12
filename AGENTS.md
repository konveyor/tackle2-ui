# AGENTS.md - AI Agent Configuration for tackle2-ui

This document describes the AI agent configuration and AI-readiness setup for the tackle2-ui project.

## Overview

The tackle2-ui project is configured to work with various AI development tools and agents to enhance development productivity, code quality, and maintenance.

## AI Agent Directory Structure

```
.agents/
├── skills/
│   └── ui/
│       └── [UI-specific agent skills]
└── README.md (this file)
```

## Supported AI Tools

### Code Analysis & Review
- **CodeRabbit**: Automated code review and analysis
- **GitHub Copilot**: AI-powered code completion
- **Conventional Commits**: Standardized commit messages for AI parsing

### Development Assistance
- **ESLint**: Static code analysis with AI-friendly rule configurations
- **Prettier**: Code formatting for consistent AI code generation
- **TypeScript**: Strong typing for better AI code understanding

## Agent Skills Configuration

### UI Development Skills

The `.agents/skills/ui/` directory contains specialized configurations for:

1. **React Component Generation**
   - PatternFly component integration
   - TypeScript interface generation
   - Responsive design patterns
   - Accessibility compliance

2. **Testing Automation**
   - Jest unit test generation
   - Cypress E2E test patterns
   - React Testing Library utilities
   - Mock data generation

3. **API Integration**
   - React Query hook generation
   - TypeScript API client code
   - Error handling patterns
   - Authentication flows

## AI-Friendly Code Patterns

### Component Structure
```typescript
// Standard component pattern for AI understanding
interface ComponentProps {
  // Explicitly typed props
}

export const ComponentName: React.FC<ComponentProps> = ({
  // Destructured props with types
}) => {
  // Component implementation
};
```

### Query Hooks
```typescript
// Standardized query hook pattern
export const useEntityQuery = (id: string) => {
  return useQuery({
    queryKey: ["entity", id],
    queryFn: () => getEntity(id),
    // Standard query options
  });
};
```

### Test Patterns
```typescript
// AI-friendly test structure
describe("ComponentName", () => {
  it("should render with expected props", () => {
    // Arrange
    const props = { /* test props */ };
    
    // Act
    render(<ComponentName {...props} />);
    
    // Assert
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

## Configuration Files for AI Tools

### ESLint Configuration
- Rules optimized for AI code generation
- TypeScript integration for better type inference
- React hooks rules for modern patterns
- Import ordering for consistent structure

### Prettier Configuration
- Consistent formatting for AI-generated code
- Line length optimization for readability
- Trailing commas for easier diffs
- Semicolon enforcement

### TypeScript Configuration
- Strict mode enabled for better AI understanding
- Path mapping for cleaner imports
- Comprehensive type checking
- JSX support for React components

## Agent Interaction Guidelines

### Code Generation
When requesting AI code generation:
1. Specify the target directory (client/src/...)
2. Include required imports and dependencies
3. Follow existing naming conventions
4. Include TypeScript types
5. Add appropriate tests

### Code Review
AI tools should check for:
1. TypeScript type safety
2. React best practices
3. PatternFly design system compliance
4. Accessibility standards (WCAG 2.1)
5. Performance considerations
6. Security best practices

### Documentation Generation
AI tools can help generate:
1. JSDoc comments for functions/components
2. README updates for new features
3. API documentation
4. Test case descriptions
5. Migration guides

## Integration with Development Workflow

### Pre-commit Hooks
- Lint staged files
- Format code with Prettier
- Run type checking
- Validate commit messages

### CI/CD Integration
- Automated code review with CodeRabbit
- Security scanning with appropriate tools
- Dependency vulnerability checks
- Performance regression detection

### Local Development
- IDE extensions for real-time AI assistance
- Code completion with context awareness
- Automated refactoring suggestions
- Test generation assistance

## Best Practices for AI Collaboration

### Code Documentation
1. Write descriptive function and component names
2. Include comprehensive JSDoc comments
3. Use semantic commit messages
4. Maintain up-to-date README files

### Type Safety
1. Avoid `any` types - use proper TypeScript types
2. Define interfaces for all props and data structures
3. Use generic types where appropriate
4. Leverage union types for finite sets of values

### Testing Strategy
1. Write tests alongside implementation
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)
4. Include edge cases and error scenarios

### Component Design
1. Keep components focused and single-purpose
2. Use composition over inheritance
3. Implement proper error boundaries
4. Follow accessibility guidelines

## Troubleshooting AI Tool Issues

### Common Problems
1. **Type errors in generated code**: Ensure TypeScript strict mode compliance
2. **Linting errors**: Follow established ESLint configuration
3. **Test failures**: Verify mock data matches actual API responses
4. **Build errors**: Check for missing dependencies or imports

### Performance Considerations
1. Use React.memo for expensive components
2. Implement proper loading states
3. Optimize bundle size with code splitting
4. Use React Query for efficient data fetching

## Contributing to AI Configuration

When updating AI tool configurations:
1. Test changes locally first
2. Document configuration changes
3. Update this AGENTS.md file
4. Coordinate with team on breaking changes

## Security Considerations

### AI Tool Usage
1. Never commit API keys or secrets
2. Use environment variables for configuration
3. Review AI-generated code for security issues
4. Validate external data sources

### Data Handling
1. Sanitize user inputs
2. Implement proper authentication
3. Use HTTPS for all API communications
4. Follow OWASP security guidelines

---

This configuration enables seamless collaboration between human developers and AI tools while maintaining code quality, security, and performance standards.
