import {describe, expect, it} from 'vitest'

import {createPagination} from './index'

describe('createPagination', () => {
  it('clamps page values and page count', () => {
    const model = createPagination({page: 99, pageCount: 4})

    expect(model.state.page()).toBe(4)
    model.actions.setPageCount(2)
    expect(model.state.page()).toBe(2)
  })

  it('navigates within bounds', () => {
    const model = createPagination({page: 2, pageCount: 3})

    model.actions.previous()
    expect(model.state.page()).toBe(1)
    model.actions.previous()
    expect(model.state.page()).toBe(1)
    model.actions.last()
    expect(model.state.page()).toBe(3)
    model.actions.next()
    expect(model.state.page()).toBe(3)
  })

  it('blocks navigation when disabled', () => {
    const model = createPagination({page: 1, pageCount: 3, disabled: true})

    model.actions.next()
    expect(model.state.page()).toBe(1)
  })

  it('generates ellipsis ranges', () => {
    const model = createPagination({page: 5, pageCount: 10, siblingCount: 1, boundaryCount: 1})

    expect(model.state.items()).toEqual([
      {type: 'page', page: 1, key: 'page-1'},
      {type: 'ellipsis', key: 'ellipsis-1-4'},
      {type: 'page', page: 4, key: 'page-4'},
      {type: 'page', page: 5, key: 'page-5'},
      {type: 'page', page: 6, key: 'page-6'},
      {type: 'ellipsis', key: 'ellipsis-6-10'},
      {type: 'page', page: 10, key: 'page-10'},
    ])
  })

  it('returns accessible current page contracts', () => {
    const model = createPagination({idBase: 'pager', page: 2, pageCount: 3})

    expect(model.contracts.getPageProps(2)).toMatchObject({
      id: 'pager-page-2',
      'aria-current': 'page',
      disabled: true,
    })
    expect(model.contracts.getNextProps()).toMatchObject({
      id: 'pager-next',
      disabled: undefined,
    })
  })
})
