# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication) + minimal justified additions
**Storage**: [if applicable, e.g., localStorage, IndexedDB, file system, or N/A]
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Clarity**: Does the design prioritize readable, explicit implementations?
- **Simple UX**: Is the user experience minimal and intuitive?
- **Minimal Dependencies**: Are dependencies justified and unavoidable?
- **Simple Over Abstract**: Does the design avoid premature abstractions?
- **No Testing**: Confirms no test infrastructure, test files, or testing frameworks included
- **Technology Stack**: Node.js, TypeScript (strict mode), Lit, Socket.IO, pnpm exclusively?
- **Desktop-First Game**: Fixed viewport, no responsive design, no mobile support?
- **Rendering**: DOM/CSS/SVG only—no HTML Canvas usage?

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── components/    # Lit web components
├── services/      # Business logic
├── models/        # Data models
└── utils/         # Utilities (prefer standard library)

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/
└── src/
    ├── models/
    ├── services/
    └── api/

frontend/
└── src/
    ├── components/  # Lit web components
    ├── pages/
    └── services/

# [REMOVE IF UNUSED] Option 3: Multi-package (monorepo with shared code)
packages/
├── ui/
│   └── src/       # Shared Lit components
├── core/
│   └── src/       # Shared business logic
└── app/
    └── src/       # Main application
## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
