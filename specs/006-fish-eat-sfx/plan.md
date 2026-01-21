# Implementation Plan: Fish Eat Crunch Sound

**Branch**: `006-fish-eat-sfx` | **Date**: January 21, 2026 | **Spec**: [specs/006-fish-eat-sfx/spec.md](specs/006-fish-eat-sfx/spec.md)
**Input**: Feature specification from `/specs/006-fish-eat-sfx/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Play `small-crunch.mp3` on every `fish-eaten` event during active gameplay, respecting existing sound settings. Implement by loading the MP3 into a Web Audio `AudioBuffer`, playing via `AudioBufferSourceNode` routed through the existing `masterGain`, and allowing overlap for rapid events. Fail silently if the asset is missing and avoid any analytics/logging for this sound.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication) + minimal justified additions
**Storage**: localStorage (existing sound-enabled preference)
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: Web application (client + server)
**Performance Goals**: Maintain 60 fps gameplay; crunch sound starts within ~100 ms of event receipt.
**Constraints**: No new dependencies, no analytics for crunch sound, no blocking gameplay on audio load.
**Scale/Scope**: 1–4 players per lobby, 2-minute matches, desktop browsers only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Clarity**: Pass — small, explicit changes in `SoundManager` and `GameManager`.
- **Simple UX**: Pass — no new UI or settings introduced.
- **Minimal Dependencies**: Pass — no new dependencies added.
- **Simple Over Abstract**: Pass — direct playback control without new abstractions.
- **No Testing**: Pass — manual verification only.
- **Technology Stack**: Pass — TypeScript + Lit + Socket.IO + pnpm retained.
- **Desktop-First Game**: Pass — no responsive work required.
- **Rendering**: Pass — no canvas usage.

## Project Structure

### Documentation (this feature)

```text
specs/006-fish-eat-sfx/
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
src/
├── client/
│   ├── components/
│   ├── game/
│   └── utils/
├── server/
│   └── game/
└── shared/
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations.

## Phase 0: Research

- Review current sound system and game event flow.
- Decide how to load and play `small-crunch.mp3` with overlap cap.
- Confirm no API changes required.

Output: [specs/006-fish-eat-sfx/research.md](specs/006-fish-eat-sfx/research.md)

## Phase 1: Design & Contracts

- Define minimal runtime data model for sound asset and playback state.
- Document that existing `game:state-update` events already carry `fish-eaten` events.
- Provide manual verification quickstart steps.

Outputs:
- [specs/006-fish-eat-sfx/data-model.md](specs/006-fish-eat-sfx/data-model.md)
- [specs/006-fish-eat-sfx/contracts/notes.md](specs/006-fish-eat-sfx/contracts/notes.md)
- [specs/006-fish-eat-sfx/quickstart.md](specs/006-fish-eat-sfx/quickstart.md)

## Constitution Check (Post-Design)

- **Code Clarity**: Pass — changes are localized and explicit.
- **Simple UX**: Pass — no new UI or settings introduced.
- **Minimal Dependencies**: Pass — no new libraries.
- **Simple Over Abstract**: Pass — direct buffer playback and source tracking.
- **No Testing**: Pass — manual validation only.
- **Technology Stack**: Pass — unchanged.
- **Desktop-First Game**: Pass — unchanged.
- **Rendering**: Pass — unchanged.
