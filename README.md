# @chromvoid/headless-ui

`@chromvoid/headless-ui` is a standalone headless package for building accessible UI behavior
without coupling that behavior to a visual layer.

It is the behavioral foundation for future ChromVoid UI kits and product interfaces:

- reactive component models built on Reatom v1000
- WAI-ARIA APG-aligned keyboard and accessibility contracts
- explicit state transitions and event handling
- framework-agnostic rendering ownership

This package does **not** ship styled components, templates, CSS, icons, or product-specific
layout decisions. It owns behavior and accessibility semantics. Your UI layer owns markup,
styling, motion, and composition.

## What This Package Is For

Use this package when you want to build:

- a design system or UI kit on top of stable headless behavior contracts
- product-specific components without rewriting keyboard, focus, and ARIA logic
- framework bindings that stay thin because the behavior already lives in the model
- accessible widgets that remain portable outside the ChromVoid monorepo

Use something else if you want:

- ready-made visual components
- a DOM renderer
- a framework-specific component library
- a package that hides Reatom from the public model shape

## Mental Model

Each component is a small behavior engine.

1. Create a model with `createX(options)`.
2. Read reactive `state` from Reatom atoms and computed values.
3. Call `actions` in response to user intent.
4. Apply `contracts.get*Props()` to your DOM or framework layer.

In other words:

- the package decides how a widget behaves
- the package exposes what ARIA attributes and handlers are required
- your app decides how the widget looks and where it is rendered

That split is the core idea behind the repository.

## How It Works

The public API is intentionally repetitive across components:

- `state`: reactive sources of truth
- `actions`: the only supported mutation path
- `contracts`: grouped prop getters for ARIA, ids, and event handlers

Typical shape:

```ts
const model = createX(options)

model.state
model.actions
model.contracts.getRootProps()
```

Example with a real component:

```ts
import {createButton} from '@chromvoid/headless-ui/button'

const button = createButton({
  idBase: 'save',
  onPress: () => {
    console.log('save')
  },
})

const buttonProps = button.contracts.getButtonProps()

button.state.isDisabled()
button.actions.setLoading(true)

buttonProps.role
buttonProps.tabindex
buttonProps.onClick
buttonProps.onKeyDown
buttonProps.onKeyUp
```

The same pattern scales from simple controls such as `button` and `checkbox` to larger widgets
such as `listbox`, `combobox`, `treeview`, `grid`, or `treegrid`.

## Design Philosophy

This package is opinionated in a very specific way.

- **Headless, not vague**: it avoids visual output, but it is strict about behavior, focus, and
  accessibility semantics.
- **Signal-first state**: public state stays reactive so UI layers can read it directly instead of
  synchronizing snapshots by hand.
- **Intent-first actions**: keyboard and pointer flows map to model actions, not scattered UI glue.
- **Contract-first accessibility**: ARIA attributes, roles, ids, and linkage are part of the
  public contract, not an afterthought.
- **Thin adapters**: adapters exist to map models into renderers, not to contain business logic.
- **Standalone by default**: the package must work outside this monorepo, with no hidden internal
  imports or release-time coupling.
- **DX over inertia in pre-v1**: while the package is still `<1.0`, ergonomics and API consistency
  take priority over preserving temporary shapes.

## Why The Repository Looks Like This

This package is developed inside a monorepo for local integration speed, but it is treated as an
independent public library.

That leads to a few hard rules:

- no imports from `@project/*`, `apps/*`, or other monorepo-only modules
- package-local scripts, tests, specs, and release checks
- explicit architecture docs and component specs
- stable lean-import support through subpath exports

This directory is a **development mirror**. The canonical release history and publishing flow live
in a separate public git-shard repository.

## Getting Started

Install the package in a Node 20+ ESM environment:

```sh
npm install @chromvoid/headless-ui
```

Then pick the import style that matches your use case.

## Import Contract

The package ships from `dist/` and supports both a convenience root barrel and lean leaf imports.

Use the root barrel when convenience matters more than bundle shape:

```ts
import {createButton, createTabs} from '@chromvoid/headless-ui'
```

Use leaf subpaths when you want a deliberately narrow dependency graph:

```ts
import {createButton} from '@chromvoid/headless-ui/button'
import {CompositeNavigationOrientation} from '@chromvoid/headless-ui/interactions/composite-navigation'
import {toggleSelection} from '@chromvoid/headless-ui/core/selection'
```

The root barrel is supported, but leaf subpaths are the stable lean-import contract for
applications and higher-level packages such as `@chromvoid/uikit`.

## What Ships In The Package

The package currently includes headless models for:

- **Inputs and selection**: `button`, `checkbox`, `combobox`, `date-picker`, `input`, `listbox`,
  `number`, `radio-group`, `select`, `slider`, `slider-multi-thumb`, `spinbutton`, `switch`,
  `textarea`
- **Feedback and content**: `alert`, `badge`, `callout`, `card`, `copy-button`, `meter`,
  `progress`, `spinner`, `toast`
- **Disclosure and overlays**: `accordion`, `alert-dialog`, `command-palette`, `context-menu`,
  `dialog`, `disclosure`, `drawer`, `menu`, `menu-button`, `popover`, `tooltip`
- **Navigation and structure**: `breadcrumb`, `landmarks`, `link`, `sidebar`, `tabs`, `toolbar`,
  `treeview`, `window-splitter`
- **Data and composite widgets**: `carousel`, `feed`, `grid`, `table`, `treegrid`

Shared layers:

- [`src/core/`](./src/core/): low-level state primitives such as selection and value-range logic
- [`src/interactions/`](./src/interactions/): keyboard intents, typeahead, composite navigation,
  overlay focus
- [`src/a11y-contracts/`](./src/a11y-contracts/): typed ARIA and role contracts
- [`src/adapters/`](./src/adapters/): thin adapter contracts for presentation-layer bindings

## Repository Map

```text
src/
  core/
  interactions/
  a11y-contracts/
  adapters/
  <component>/

specs/
  ADR-*.md
  components/<component>.md
  release/*
  ops/*
```

Repository conventions:

- every component lives in [`src/<component>/`](./src/)
- every component has a colocated test file in `src/<component>/<component>.test.ts`
- every component has a dedicated behavior spec in [`specs/components/<component>.md`](./specs/components/)
- package boundaries are enforced so the code remains portable outside this monorepo

## Quality And Release Discipline

The repository treats behavior and accessibility as release contracts, not informal implementation
details.

That discipline is enforced through:

- unit tests for transitions and invariants
- shared APG regression coverage for cross-component accessibility guarantees
- package export checks and bundle shape checks
- standalone boundary checks to prevent accidental monorepo coupling
- explicit SemVer and deprecation policy for public API evolution

## Package-Local Workflow

Run all package checks from the package root:

```sh
npm ci
npm run lint
npm run test
npm run build
npm pack --dry-run
```

## Read Next

If you are new to the repository, these documents explain the bigger picture:

- [`./specs/ADR-001-headless-architecture.md`](./specs/ADR-001-headless-architecture.md)
- [`./specs/ADR-003-public-api-versioning.md`](./specs/ADR-003-public-api-versioning.md)
- [`./specs/ADR-004-focus-selection-policy.md`](./specs/ADR-004-focus-selection-policy.md)
- [`./specs/IMPLEMENTATION-ROADMAP.md`](./specs/IMPLEMENTATION-ROADMAP.md)
- [`./specs/ISSUE-BACKLOG.md`](./specs/ISSUE-BACKLOG.md)
- [`./specs/RELEASE-CANDIDATE.md`](./specs/RELEASE-CANDIDATE.md)
