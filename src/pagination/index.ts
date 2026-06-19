import {action, atom, type Atom} from '@reatom/core'

export type PaginationItem = {type: 'page'; page: number; key: string} | {type: 'ellipsis'; key: string}

export interface CreatePaginationOptions {
  idBase?: string
  page?: number
  pageCount?: number
  siblingCount?: number
  boundaryCount?: number
  disabled?: boolean
  ariaLabel?: string
}

export interface PaginationState {
  page: Atom<number>
  pageCount: Atom<number>
  disabled: Atom<boolean>
  items(): readonly PaginationItem[]
  canGoPrevious(): boolean
  canGoNext(): boolean
}

export interface PaginationActions {
  setPage(page: number): void
  setPageCount(pageCount: number): void
  setDisabled(disabled: boolean): void
  previous(): void
  next(): void
  first(): void
  last(): void
}

export interface PaginationNavProps {
  role: 'navigation'
  'aria-label': string
}

export interface PaginationButtonProps {
  id: string
  type: 'button'
  'aria-label': string
  'aria-current'?: 'page'
  'aria-disabled'?: 'true'
  disabled?: boolean
  onClick: () => void
}

export interface PaginationContracts {
  getNavProps(): PaginationNavProps
  getPageProps(page: number): PaginationButtonProps
  getPreviousProps(): PaginationButtonProps
  getNextProps(): PaginationButtonProps
}

export interface PaginationModel {
  readonly state: PaginationState
  readonly actions: PaginationActions
  readonly contracts: PaginationContracts
}

const positiveInteger = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) return fallback
  return Math.floor(value)
}

const nonNegativeInteger = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return fallback
  return Math.floor(value)
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

function createPageRange(
  page: number,
  pageCount: number,
  siblingCount: number,
  boundaryCount: number,
): readonly PaginationItem[] {
  const visible = boundaryCount * 2 + siblingCount * 2 + 3
  if (pageCount <= visible) {
    return Array.from({length: pageCount}, (_, index) => ({
      type: 'page' as const,
      page: index + 1,
      key: `page-${index + 1}`,
    }))
  }

  const pages = new Set<number>()
  for (let i = 1; i <= boundaryCount; i += 1) pages.add(i)
  for (let i = pageCount - boundaryCount + 1; i <= pageCount; i += 1) pages.add(i)
  for (let i = page - siblingCount; i <= page + siblingCount; i += 1) {
    if (i >= 1 && i <= pageCount) pages.add(i)
  }

  const sorted = [...pages].sort((left, right) => left - right)
  const result: PaginationItem[] = []
  for (const current of sorted) {
    const previous = result.at(-1)
    if (previous?.type === 'page' && current - previous.page > 1) {
      result.push({type: 'ellipsis', key: `ellipsis-${previous.page}-${current}`})
    }
    result.push({type: 'page', page: current, key: `page-${current}`})
  }
  return result
}

export function createPagination(options: CreatePaginationOptions = {}): PaginationModel {
  const idBase = options.idBase ?? 'pagination'
  const siblingCount = nonNegativeInteger(options.siblingCount, 1)
  const boundaryCount = nonNegativeInteger(options.boundaryCount, 1)
  const pageCountAtom = atom(positiveInteger(options.pageCount, 1), `${idBase}.pageCount`)
  const pageAtom = atom(clamp(positiveInteger(options.page, 1), 1, pageCountAtom()), `${idBase}.page`)
  const disabledAtom = atom(options.disabled ?? false, `${idBase}.disabled`)

  const setPage = action((page: number) => {
    if (disabledAtom()) return
    pageAtom.set(clamp(positiveInteger(page, 1), 1, pageCountAtom()))
  }, `${idBase}.setPage`)

  const setPageCount = action((pageCount: number) => {
    pageCountAtom.set(positiveInteger(pageCount, 1))
    pageAtom.set(clamp(pageAtom(), 1, pageCountAtom()))
  }, `${idBase}.setPageCount`)

  const setDisabled = action((disabled: boolean) => {
    disabledAtom.set(disabled)
  }, `${idBase}.setDisabled`)

  const previous = action(() => setPage(pageAtom() - 1), `${idBase}.previous`)
  const next = action(() => setPage(pageAtom() + 1), `${idBase}.next`)
  const first = action(() => setPage(1), `${idBase}.first`)
  const last = action(() => setPage(pageCountAtom()), `${idBase}.last`)

  const isDisabled = (targetPage: number) => disabledAtom() || targetPage === pageAtom()

  const state: PaginationState = {
    page: pageAtom,
    pageCount: pageCountAtom,
    disabled: disabledAtom,
    items() {
      return createPageRange(pageAtom(), pageCountAtom(), siblingCount, boundaryCount)
    },
    canGoPrevious() {
      return !disabledAtom() && pageAtom() > 1
    },
    canGoNext() {
      return !disabledAtom() && pageAtom() < pageCountAtom()
    },
  }

  const contracts: PaginationContracts = {
    getNavProps() {
      return {
        role: 'navigation',
        'aria-label': options.ariaLabel ?? 'Pagination',
      }
    },
    getPageProps(page: number) {
      const safePage = clamp(positiveInteger(page, 1), 1, pageCountAtom())
      const current = safePage === pageAtom()
      const disabled = isDisabled(safePage)
      return {
        id: `${idBase}-page-${safePage}`,
        type: 'button',
        'aria-label': current ? `Page ${safePage}, current page` : `Go to page ${safePage}`,
        'aria-current': current ? 'page' : undefined,
        'aria-disabled': disabled ? 'true' : undefined,
        disabled: disabled || undefined,
        onClick: () => setPage(safePage),
      }
    },
    getPreviousProps() {
      const disabled = !state.canGoPrevious()
      return {
        id: `${idBase}-previous`,
        type: 'button',
        'aria-label': 'Go to previous page',
        'aria-disabled': disabled ? 'true' : undefined,
        disabled: disabled || undefined,
        onClick: previous,
      }
    },
    getNextProps() {
      const disabled = !state.canGoNext()
      return {
        id: `${idBase}-next`,
        type: 'button',
        'aria-label': 'Go to next page',
        'aria-disabled': disabled ? 'true' : undefined,
        disabled: disabled || undefined,
        onClick: next,
      }
    },
  }

  return {
    state,
    actions: {setPage, setPageCount, setDisabled, previous, next, first, last},
    contracts,
  }
}
