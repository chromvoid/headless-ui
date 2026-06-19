# Code Input Component Contract

## Purpose

`CodeInput` provides a headless model for segmented short-code entry such as PIN, OTP, pairing,
and recovery codes. It owns value normalization, slot focus index, paste distribution, backspace
semantics, disabled/readonly gating, and per-slot accessibility props.

## Public API

- `createCodeInput(options)`
  - `idBase?`
  - `length?` default `6`
  - `value?`
  - `purpose?`: `pin | otp | pairing | recovery`
  - `charset?`: `numeric | alphanumeric`
  - `mask?`
  - `disabled?`
  - `readonly?`
  - `required?`
  - `autocomplete?`
  - `name?`

## State

- `value()`: normalized code string
- `length()`: positive segment count
- `activeIndex()`: focused segment index
- `disabled()`, `readonly()`, `required()`
- `purpose`, `charset`, `mask`, `autocomplete`, `name`
- `isComplete()`: true when `value.length === length`

## Actions

- `setValue(value)`
- `setLength(length)`
- `setDisabled(value)`
- `setReadonly(value)`
- `setRequired(value)`
- `setActiveIndex(index)`
- `inputAt(index, text)`
- `backspaceAt(index)`
- `moveBy(delta)`, `moveFirst()`, `moveLast()`
- `clear()`

All write actions are no-ops when disabled or readonly, except disabled/readonly setters.

## Contracts

- `getGroupProps()` returns group role, orientation and disabled state.
- `getInputProps(index)` returns id, value, inputmode, maxlength, autocomplete, required,
  disabled/readonly state, and ARIA label for a segment.
- `getHiddenInputProps()` returns name/value/required/disabled for form mirroring.

## Behavior

- Numeric charset strips non-digits.
- Alphanumeric charset strips non-alphanumeric characters.
- Input or paste text at a segment fills from that segment forward and clamps to length.
- Backspace clears the current segment, or the previous segment when the current segment is empty.
- Active index is clamped to the valid segment range.

## Minimum Test Matrix

- default length/value/complete state
- numeric and alphanumeric normalization
- typing and paste distribution
- backspace current/previous behavior
- focus movement clamping
- disabled and readonly no-ops
- contract props and hidden form props
