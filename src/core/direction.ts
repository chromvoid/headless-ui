export type TextDirection = 'ltr' | 'rtl'

export type HorizontalArrowKey = 'ArrowLeft' | 'ArrowRight'

export type LogicalHorizontalArrow = 'previous' | 'next'
export type LogicalHierarchyArrow = 'backward' | 'forward'

export const getLogicalPreviousArrowKey = (direction: TextDirection = 'ltr'): HorizontalArrowKey =>
  direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'

export const getLogicalNextArrowKey = (direction: TextDirection = 'ltr'): HorizontalArrowKey =>
  direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'

export const resolveLogicalHorizontalArrow = (
  key: string,
  direction: TextDirection = 'ltr',
): LogicalHorizontalArrow | null => {
  if (key === getLogicalPreviousArrowKey(direction)) return 'previous'
  if (key === getLogicalNextArrowKey(direction)) return 'next'
  return null
}

export const resolveLogicalHierarchyArrow = (
  key: string,
  direction: TextDirection = 'ltr',
): LogicalHierarchyArrow | null => {
  const horizontalArrow = resolveLogicalHorizontalArrow(key, direction)
  if (horizontalArrow === 'previous') return 'backward'
  if (horizontalArrow === 'next') return 'forward'
  return null
}
