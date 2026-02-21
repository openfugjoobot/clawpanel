# Contributing to ClawPanel

Thank you for your interest in contributing to ClawPanel! This document provides guidelines and instructions for contributing.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/clawpanel.git`
3. Install dependencies: `npm install && cd frontend && npm install`
4. Create a `.env` file from `.env.example`
5. Start development servers

## 📋 Development Setup

### Backend

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## 🌿 Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

## ✏️ Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tool changes

### Examples

```
feat(api): add endpoint for workspace file upload

fix(frontend): correct session refresh interval

docs(readme): add development instructions

refactor(backend): simplify auth middleware
```

## 🔍 Code Style

### TypeScript

- Use strict TypeScript mode
- Prefer `interface` over `type` for object shapes
- Use async/await for asynchronous code
- Include explicit return types for exported functions

### React

- Use functional components with hooks
- Use TypeScript for all components
- One component per file (default export)
- Props interface named `{ComponentName}Props`

### CSS/Tailwind

- Use Tailwind utility classes
- Avoid arbitrary values when possible
- Follow mobile-first responsive design

## 🧪 Testing

Before submitting a PR:

1. Run all tests: `npm test`
2. Check TypeScript compilation: `npm run build`
3. Run linter: `npm run lint` (frontend)
4. Test your changes manually

## 📝 Pull Request Process

1. Update documentation if needed
2. Add/update tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md with your changes
5. Submit PR against the `develop` branch
6. Request review from maintainers

## 📦 Release Process

1. Version bump in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag -a v1.0.0 -m "Version 1.0.0"`
4. Push tags: `git push origin --tags`

## 💬 Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase

## 🏆 Recognition

Contributors will be acknowledged in our README and release notes!

---

Thank you for contributing to ClawPanel! 🎉
