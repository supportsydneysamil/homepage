# Global Settings Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify change tracking, validation, appearance hierarchy, and failure handling across Global Settings.

**Architecture:** Pure helpers compute dirty tabs and validation issues. A validation context decorates shared settings fields. The settings page owns the fixed save bar and validates before uploads. The API cleans newly uploaded paths only when database persistence fails.

**Tech Stack:** Next.js 16, React 18, TypeScript, Azure Functions, Azure SQL, Node test runner.

## Global Constraints

- Preserve the three-tab information architecture.
- Preserve one global save payload.
- Do not publish theme changes before save.
- Do not silently replace invalid user input with defaults.
- Keep all existing settings backwards compatible.

---

### Task 1: Dirty state and save bar

**Files:** `app/src/lib/settingsDraft.ts`, `app/src/lib/settingsDraft.test.ts`, `app/src/pages/settings.tsx`, `app/src/styles/globals.css`

- [ ] Test semantic equality and per-tab dirty classification.
- [ ] Compute dirty tabs including files and composition.
- [ ] Add the fixed save bar and disable no-op saves.
- [ ] Defer theme application until save succeeds.

### Task 2: Draft validation

**Files:** `app/src/lib/settingsValidation.ts`, `app/src/lib/settingsValidation.test.ts`, `app/src/components/settings/*`, `app/src/pages/settings.tsx`

- [ ] Test church facts, service format, empty copy, and length limits.
- [ ] Add shared validation context and accessible field errors.
- [ ] Prevent removal of the final service.
- [ ] Navigate, disclose, and focus the first invalid field.
- [ ] Allow the optional second address line to remain empty.

### Task 3: Appearance alignment

**Files:** `app/src/components/settings/AppearanceFields.tsx`, `app/src/pages/settings.tsx`, `app/src/styles/globals.css`

- [ ] Add the tab heading and description.
- [ ] Remove duplicate logo heading.
- [ ] Add logo publication state and align action colors.

### Task 4: Failed-save cleanup

**Files:** `api/site-settings/index.js`, `api/site-settings/index.test.js`

- [ ] Add a failing test for an unreferenced new site image after database failure.
- [ ] Delete only paths absent from the previous settings.
- [ ] Preserve existing paths and never clean after a successful save.

### Task 5: Verification

- [ ] Run all app tests, API tests, typecheck, build, and lints.
- [ ] Inspect wide and narrow screenshots for all settings tabs.
- [ ] Leave changes uncommitted for user review.
