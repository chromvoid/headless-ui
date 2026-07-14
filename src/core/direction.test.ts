import {describe, expect, it} from 'vitest'

import {
  getLogicalNextArrowKey,
  getLogicalPreviousArrowKey,
  resolveLogicalHierarchyArrow,
  resolveLogicalHorizontalArrow,
} from './direction'

describe('logical direction primitives', () => {
  it('resolves LTR previous and next arrow keys', () => {
    expect(getLogicalPreviousArrowKey('ltr')).toBe('ArrowLeft')
    expect(getLogicalNextArrowKey('ltr')).toBe('ArrowRight')
    expect(resolveLogicalHorizontalArrow('ArrowLeft', 'ltr')).toBe('previous')
    expect(resolveLogicalHorizontalArrow('ArrowRight', 'ltr')).toBe('next')
    expect(resolveLogicalHierarchyArrow('ArrowLeft', 'ltr')).toBe('backward')
    expect(resolveLogicalHierarchyArrow('ArrowRight', 'ltr')).toBe('forward')
  })

  it('resolves RTL previous and next arrow keys', () => {
    expect(getLogicalPreviousArrowKey('rtl')).toBe('ArrowRight')
    expect(getLogicalNextArrowKey('rtl')).toBe('ArrowLeft')
    expect(resolveLogicalHorizontalArrow('ArrowRight', 'rtl')).toBe('previous')
    expect(resolveLogicalHorizontalArrow('ArrowLeft', 'rtl')).toBe('next')
    expect(resolveLogicalHierarchyArrow('ArrowRight', 'rtl')).toBe('backward')
    expect(resolveLogicalHierarchyArrow('ArrowLeft', 'rtl')).toBe('forward')
  })

  it('ignores non-horizontal-arrow keys', () => {
    expect(resolveLogicalHorizontalArrow('ArrowUp', 'rtl')).toBeNull()
    expect(resolveLogicalHorizontalArrow('Home', 'ltr')).toBeNull()
    expect(resolveLogicalHierarchyArrow('ArrowDown', 'rtl')).toBeNull()
  })
})
