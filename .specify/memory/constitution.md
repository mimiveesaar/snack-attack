<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.1.0 (Minor: Added game-specific constraints)
Modified Principles: N/A
Added Sections:
  - Project Context (new section)
  - Rendering Constraints (under Technology Stack)
  - socket.io added to mandatory technology stack
Removed Sections: N/A
Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md - Constitution checks include game constraints
  ⚠️ .specify/templates/spec-template.md - No changes needed (validation approach unchanged)
  ⚠️ .specify/templates/tasks-template.md - No changes needed (task structure unchanged)
Follow-up TODOs: None
-->

# Snack Attack Constitution

## Core Principles

### I. Code Clarity (NON-NEGOTIABLE)

Code MUST be clean and immediately readable. Every function, variable, and structure must have a clear, single purpose. Prefer explicit, self-documenting code over clever abstractions. Comments explain why, not what. Avoid indirection—if logic can be written inline without repetition, do so. Complex patterns require written justification referencing specific, measurable benefits.

**Rationale**: Readability ensures maintainability and reduces onboarding friction. Direct code is debuggable code.

### II. Simple and Direct UX (NON-NEGOTIABLE)

User interfaces MUST be intuitive and minimal. Every interaction should have a clear purpose and immediate feedback. Remove unnecessary steps, options, and visual noise. Users should never need documentation to understand core functionality. Each UI element must justify its presence—if it doesn't serve the primary user goal, remove it.

**Rationale**: Simplicity reduces cognitive load and increases user satisfaction. Complexity is a design failure, not a feature.

### III. Minimal Dependencies (NON-NEGOTIABLE)

Favor the standard library over third-party packages. Every external dependency MUST provide clear, unavoidable value that cannot be reasonably implemented in-house. Dependencies introduce risk (supply chain, maintenance burden, bloat). Before adding a dependency, implement a simple version first to understand the problem space. Document why the dependency is necessary and what alternatives were considered.

**Rationale**: Fewer dependencies mean faster builds, smaller bundles, fewer security vulnerabilities, and greater long-term stability.

### IV. Simple Over Abstract

Prefer simple, explicit implementations over abstractions, frameworks, and patterns. Write straightforward procedural code first. Introduce abstractions only when duplication proves genuinely costly and the abstraction is obvious. Avoid premature optimization and architecture astronautics. Reject inheritance hierarchies, excessive interfaces, and design patterns without concrete, measured justification.

**Rationale**: Simplicity enables rapid iteration and debugging. Abstractions should emerge from need, not anticipation.

### V. No Testing (NON-NEGOTIABLE)

Testing is absolutely prohibited. No unit tests, no integration tests, no end-to-end tests, no test frameworks, no test infrastructure. This principle supersedes all other guidance, industry standards, and conventional wisdom. The project prioritizes iteration speed and simplicity over formal correctness.

**Rationale**: Testing infrastructure slows development velocity. Manual validation and real-world usage are sufficient quality gates for this project's goals.

## Project Context

This is a **desktop-first web browser game**. The following constraints apply:

- **Target Platform**: Desktop web browsers exclusively (Chrome, Firefox, Safari, Edge)
- **Viewport**: Fixed viewport size is acceptable and preferred—no responsive design or mobile support required
- **Form Factor**: Optimized for desktop displays; mobile devices are not a design consideration

**Rationale**: Desktop-first focus eliminates responsive design complexity and allows optimized, predictable layout for game mechanics.

## Technology Stack

The following technologies are mandatory and immutable without constitutional amendment:

- **Runtime**: Node.js (current LTS version)
- **Language**: TypeScript (strict mode enabled)
- **UI Framework**: Lit (web components)
- **Real-time Communication**: Socket.IO (for multiplayer and live game state)
- **Package Manager**: pnpm (for efficient dependency management)

All features MUST use these technologies exclusively. No alternative runtimes, transpilers, or UI frameworks are permitted. TypeScript strict mode flags MUST remain enabled to enforce type safety.

### Rendering Constraints

- **HTML Canvas is PROHIBITED**: All rendering must use DOM-based approaches (CSS, SVG, Lit components)
- **Rationale**: DOM-based rendering aligns with Lit's component model, enables better accessibility, and avoids Canvas complexity
- Animations and visual effects must use CSS transitions, CSS animations, or Web Animations API

## Development Standards

### Dependency Management

- Use pnpm for all package operations
- Lock files (pnpm-lock.yaml) MUST be committed
- Dependency updates require explicit justification in commit messages
- Development dependencies are subject to the same scrutiny as production dependencies

### Code Style

- Prefer TypeScript standard library functions over utility libraries
- Use native Web APIs where available instead of polyfills or abstractions
- Avoid build-time magic—prefer explicit, traceable transformations
- Configuration files should be minimal and explicit

### Implementation Workflow

- Feature requirements → Direct implementation
- Manual verification replaces automated testing
- Iterate based on real user feedback, not test suites
- Deploy early and often

## Governance

This constitution supersedes all other practices, conventions, and external standards. Every design decision, code review, and feature must align with these principles.

### Amendment Process

1. Proposed changes must document rationale and impact on existing code
2. Version bump follows semantic versioning (MAJOR for principle changes, MINOR for new sections, PATCH for clarifications)
3. All dependent templates and documentation MUST be updated before amendment is ratified

### Compliance

- Constitution violations require explicit justification filed in project documentation
- Complexity additions must demonstrate measurable benefit over simple alternatives
- Reviewers MUST verify constitutional alignment before approving changes

### Versioning

This document follows semantic versioning:
- **MAJOR**: Backward-incompatible changes to core principles
- **MINOR**: New principles or sections added
- **PATCH**: Clarifications, wording improvements, non-semantic changes

**Version**: 1.1.0 | **Ratified**: 2026-01-16 | **Last Amended**: 2026-01-16
