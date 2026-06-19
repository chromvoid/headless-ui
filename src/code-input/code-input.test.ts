import {describe, expect, it} from 'vitest'

import {createCodeInput} from './index'

describe('createCodeInput', () => {
  it('normalizes defaults and reports completion', () => {
    const model = createCodeInput({value: '12a3456'})

    expect(model.state.length()).toBe(6)
    expect(model.state.value()).toBe('123456')
    expect(model.state.isComplete()).toBe(true)
  })

  it('distributes typed and pasted text from the target index', () => {
    const model = createCodeInput({length: 6})

    model.actions.inputAt(0, '12')
    model.actions.inputAt(2, '3456')

    expect(model.state.value()).toBe('123456')
    expect(model.state.activeIndex()).toBe(5)
  })

  it('supports alphanumeric values', () => {
    const model = createCodeInput({length: 4, charset: 'alphanumeric'})

    model.actions.inputAt(0, 'a-b2!')

    expect(model.state.value()).toBe('ab2')
  })

  it('clears current or previous segment on backspace', () => {
    const model = createCodeInput({length: 4, value: '1234'})

    model.actions.backspaceAt(2)
    expect(model.state.value()).toBe('124')
    expect(model.state.activeIndex()).toBe(2)

    model.actions.backspaceAt(3)
    expect(model.state.value()).toBe('12')
    expect(model.state.activeIndex()).toBe(2)
  })

  it('blocks user value changes while disabled or readonly', () => {
    const model = createCodeInput({value: '12', disabled: true})

    model.actions.inputAt(2, '34')
    expect(model.state.value()).toBe('12')

    model.actions.setDisabled(false)
    model.actions.setReadonly(true)
    model.actions.clear()
    expect(model.state.value()).toBe('12')
  })

  it('keeps programmatic setValue available while disabled', () => {
    const model = createCodeInput({value: '12', disabled: true})

    model.actions.setValue('3456')

    expect(model.state.value()).toBe('3456')
  })

  it('returns slot and hidden input contracts', () => {
    const model = createCodeInput({idBase: 'pair', name: 'code', value: '7', required: true})

    expect(model.contracts.getInputProps(0)).toMatchObject({
      id: 'pair-slot-1',
      value: '7',
      inputmode: 'numeric',
      'aria-required': 'true',
    })
    expect(model.contracts.getHiddenInputProps()).toMatchObject({
      type: 'hidden',
      name: 'code',
      value: '7',
      required: true,
    })
  })
})
