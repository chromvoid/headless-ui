import {resolveLogicalHorizontalArrow, type TextDirection} from '../core/direction'

export type ListOrientation = 'vertical' | 'horizontal'
export type KeyboardSelectionMode = 'single' | 'multiple'

export interface KeyboardEventLike {
  key: string
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
}

export interface ListKeyboardIntentContext {
  orientation: ListOrientation
  selectionMode: KeyboardSelectionMode
  rangeSelectionEnabled: boolean
  direction?: TextDirection
}

export type ListKeyboardIntent =
  | 'NAV_NEXT'
  | 'NAV_PREV'
  | 'NAV_FIRST'
  | 'NAV_LAST'
  | 'TOGGLE_SELECTION'
  | 'RANGE_NEXT'
  | 'RANGE_PREV'
  | 'RANGE_SELECT_ACTIVE'
  | 'ACTIVATE'
  | 'DISMISS'
  | 'SELECT_ALL'

const isSelectAllShortcut = (event: KeyboardEventLike) =>
  (event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'a'

export function mapListboxKeyboardIntent(
  event: KeyboardEventLike,
  context: ListKeyboardIntentContext,
): ListKeyboardIntent | null {
  const horizontalArrow =
    context.orientation === 'horizontal'
      ? resolveLogicalHorizontalArrow(event.key, context.direction ?? 'ltr')
      : null
  const isNextKey =
    context.orientation === 'horizontal' ? horizontalArrow === 'next' : event.key === 'ArrowDown'
  const isPrevKey =
    context.orientation === 'horizontal' ? horizontalArrow === 'previous' : event.key === 'ArrowUp'

  const rangeEnabled = context.selectionMode === 'multiple' && context.rangeSelectionEnabled

  if (isNextKey) {
    if (rangeEnabled && event.shiftKey) return 'RANGE_NEXT'
    return 'NAV_NEXT'
  }

  if (isPrevKey) {
    if (rangeEnabled && event.shiftKey) return 'RANGE_PREV'
    return 'NAV_PREV'
  }

  if (event.key === 'Home') return 'NAV_FIRST'
  if (event.key === 'End') return 'NAV_LAST'
  if (event.key === 'Escape') return 'DISMISS'

  if (event.key === ' ' || event.key === 'Spacebar') {
    if (rangeEnabled && event.shiftKey) return 'RANGE_SELECT_ACTIVE'
    return 'TOGGLE_SELECTION'
  }

  if (event.key === 'Enter') return 'ACTIVATE'

  if (context.selectionMode === 'multiple' && isSelectAllShortcut(event)) {
    return 'SELECT_ALL'
  }

  return null
}
