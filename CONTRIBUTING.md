# Contributing to Vault

Thank you for your interest in contributing to Vault! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/vault.git
   cd vault
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Add your credentials
   ```
5. **Run development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 2. Make Changes

- Write clean, readable code
- Follow TypeScript best practices
- Add comments for complex logic
- Update tests if needed

### 3. Test Your Changes

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

### 4. Commit Changes

Follow conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue #123"
git commit -m "docs: update README"
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### TypeScript

- Use TypeScript strict mode
- Define types for all props and functions
- Avoid `any` unless absolutely necessary
- Use interfaces over types when possible

```typescript
// Good
interface UserProps {
  name: string;
  email: string;
}

// Avoid
const userData: any = {};
```

### React Components

- Use functional components
- Use hooks for state management
- Keep components small and focused
- Use proper naming (PascalCase for components)

```typescript
// Good
export default function DocumentCard({ document }: { document: Document }) {
  const [isLoading, setIsLoading] = useState(false);

  return <Card>...</Card>;
}
```

### File Organization

```
src/
├── app/              # Next.js pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── dashboard/   # Feature components
├── lib/             # Utilities
│   ├── supabase/
│   ├── claude/
│   └── utils.ts
└── types/           # TypeScript types
```

## Testing

Currently, we don't have comprehensive tests. Contributions to add tests are welcome!

## Documentation

- Update README.md for major features
- Add JSDoc comments for complex functions
- Update API.md for API changes
- Create examples in /examples directory

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** if applicable
3. **Ensure build passes**: `npm run build`
4. **Write clear PR description**:
   - What does this PR do?
   - Why is this change needed?
   - How to test it?
   - Screenshots (if UI changes)

5. **Link related issues**: `Closes #123`

## Areas to Contribute

### High Priority
- [ ] Add comprehensive tests
- [ ] Improve error handling
- [ ] Add search filters UI
- [ ] Implement knowledge graph visualization
- [ ] Add timeline view

### Medium Priority
- [ ] Add more file type support
- [ ] Improve mobile responsiveness
- [ ] Add keyboard shortcuts
- [ ] Implement dark mode toggle
- [ ] Add export functionality

### Documentation
- [ ] Add video tutorials
- [ ] Create example projects
- [ ] Write blog posts
- [ ] Translate documentation

## Questions?

- Open a GitHub Discussion
- Email: contribute@vault.ai
- Join our Discord

Thank you for contributing! 🎉
