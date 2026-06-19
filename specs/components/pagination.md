# Pagination Component Contract

## Purpose

`Pagination` provides a headless page navigation model. It owns page bounds, page range generation
with ellipsis, previous/next/first/last actions, disabled state, and per-item accessibility props.

## Public API

- `createPagination(options)`
  - `idBase?`
  - `page?` default `1`
  - `pageCount` default `1`
  - `siblingCount?` default `1`
  - `boundaryCount?` default `1`
  - `disabled?`

## State

- `page()`: current page, clamped to `[1, pageCount]`
- `pageCount()`: total page count, minimum `1`
- `disabled()`
- `items()`: ordered `page` and `ellipsis` records for rendering
- `canGoPrevious()`, `canGoNext()`

## Actions

- `setPage(page)`
- `setPageCount(pageCount)`
- `setDisabled(value)`
- `next()`, `previous()`, `first()`, `last()`

Navigation actions are no-ops while disabled.

## Contracts

- `getNavProps()` returns `role="navigation"` and an accessible label.
- `getPageProps(page)` returns button props, `aria-current="page"` for the active page, and disabled
  state for unavailable actions.
- `getPreviousProps()` and `getNextProps()` expose bounded navigation buttons.

## Minimum Test Matrix

- page and pageCount clamping
- previous/next/first/last behavior
- disabled no-ops
- range generation with and without ellipsis
- current page ARIA contract
