import {action, atom, type Atom} from '@reatom/core'

export type CodeInputPurpose = 'pin' | 'otp' | 'pairing' | 'recovery'
export type CodeInputCharset = 'numeric' | 'alphanumeric'

export interface CreateCodeInputOptions {
  idBase?: string
  length?: number
  value?: string
  purpose?: CodeInputPurpose
  charset?: CodeInputCharset
  mask?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  autocomplete?: string
  name?: string
}

export interface CodeInputState {
  value: Atom<string>
  length: Atom<number>
  activeIndex: Atom<number>
  disabled: Atom<boolean>
  readonly: Atom<boolean>
  required: Atom<boolean>
  purpose: CodeInputPurpose
  charset: CodeInputCharset
  mask: boolean
  autocomplete: string
  name: string
  charAt(index: number): string
  isComplete(): boolean
}

export interface CodeInputActions {
  setValue(value: string): void
  setLength(length: number): void
  setDisabled(disabled: boolean): void
  setReadonly(readonly: boolean): void
  setRequired(required: boolean): void
  setActiveIndex(index: number): void
  inputAt(index: number, text: string): void
  backspaceAt(index: number): void
  moveBy(delta: number): void
  moveFirst(): void
  moveLast(): void
  clear(): void
}

export interface CodeInputGroupProps {
  role: 'group'
  'aria-disabled'?: 'true'
  'aria-readonly'?: 'true'
}

export interface CodeInputSlotProps {
  id: string
  value: string
  type: 'text' | 'password'
  inputmode: 'numeric' | 'text'
  autocomplete?: string
  maxlength: number
  tabindex: '0' | '-1'
  'aria-label': string
  'aria-disabled'?: 'true'
  'aria-readonly'?: 'true'
  'aria-required'?: 'true'
  disabled?: boolean
  readonly?: boolean
  required?: boolean
}

export interface CodeInputHiddenInputProps {
  type: 'hidden'
  name?: string
  value: string
  disabled?: boolean
  required?: boolean
}

export interface CodeInputContracts {
  getGroupProps(): CodeInputGroupProps
  getInputProps(index: number): CodeInputSlotProps
  getHiddenInputProps(): CodeInputHiddenInputProps
}

export interface CodeInputModel {
  readonly state: CodeInputState
  readonly actions: CodeInputActions
  readonly contracts: CodeInputContracts
}

const normalizeLength = (value: number | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) return 6
  return Math.floor(value)
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const sanitizeForCharset = (value: string, charset: CodeInputCharset): string => {
  const pattern = charset === 'numeric' ? /\d/g : /[a-zA-Z0-9]/g
  return value.match(pattern)?.join('') ?? ''
}

const defaultAutocomplete = (purpose: CodeInputPurpose): string => {
  if (purpose === 'otp') return 'one-time-code'
  if (purpose === 'pin') return 'off'
  return 'off'
}

export function createCodeInput(options: CreateCodeInputOptions = {}): CodeInputModel {
  const idBase = options.idBase ?? 'code-input'
  const purpose = options.purpose ?? 'otp'
  const charset = options.charset ?? 'numeric'
  const mask = options.mask ?? false
  const autocomplete = options.autocomplete ?? defaultAutocomplete(purpose)
  const name = options.name ?? ''

  const lengthAtom = atom(normalizeLength(options.length), `${idBase}.length`)
  const valueAtom = atom(
    sanitizeForCharset(options.value ?? '', charset).slice(0, lengthAtom()),
    `${idBase}.value`,
  )
  const activeIndexAtom = atom(0, `${idBase}.activeIndex`)
  const disabledAtom = atom(options.disabled ?? false, `${idBase}.disabled`)
  const readonlyAtom = atom(options.readonly ?? false, `${idBase}.readonly`)
  const requiredAtom = atom(options.required ?? false, `${idBase}.required`)

  const isBlocked = () => disabledAtom() || readonlyAtom()
  const normalize = (value: string) => sanitizeForCharset(value, charset).slice(0, lengthAtom())
  const clampIndex = (index: number) => clamp(Math.floor(index), 0, lengthAtom() - 1)

  const setValue = action((value: string) => {
    valueAtom.set(normalize(value))
    activeIndexAtom.set(clampIndex(valueAtom().length))
  }, `${idBase}.setValue`)

  const setLength = action((length: number) => {
    lengthAtom.set(normalizeLength(length))
    valueAtom.set(normalize(valueAtom()))
    activeIndexAtom.set(clampIndex(activeIndexAtom()))
  }, `${idBase}.setLength`)

  const setDisabled = action((disabled: boolean) => {
    disabledAtom.set(disabled)
  }, `${idBase}.setDisabled`)

  const setReadonly = action((readonly: boolean) => {
    readonlyAtom.set(readonly)
  }, `${idBase}.setReadonly`)

  const setRequired = action((required: boolean) => {
    requiredAtom.set(required)
  }, `${idBase}.setRequired`)

  const setActiveIndex = action((index: number) => {
    activeIndexAtom.set(clampIndex(index))
  }, `${idBase}.setActiveIndex`)

  const inputAt = action((index: number, text: string) => {
    if (isBlocked()) return
    const accepted = sanitizeForCharset(text, charset)
    if (!accepted) return

    const start = clampIndex(index)
    const chars = Array.from({length: lengthAtom()}, (_, i) => valueAtom()[i] ?? '')
    for (let offset = 0; offset < accepted.length && start + offset < chars.length; offset += 1) {
      chars[start + offset] = accepted[offset] ?? ''
    }
    valueAtom.set(chars.join('').slice(0, lengthAtom()))
    activeIndexAtom.set(clamp(start + accepted.length, 0, lengthAtom() - 1))
  }, `${idBase}.inputAt`)

  const backspaceAt = action((index: number) => {
    if (isBlocked()) return
    const current = clampIndex(index)
    const chars = Array.from({length: lengthAtom()}, (_, i) => valueAtom()[i] ?? '')
    if (chars[current]) {
      chars[current] = ''
      activeIndexAtom.set(current)
    } else if (current > 0) {
      chars[current - 1] = ''
      activeIndexAtom.set(current - 1)
    }
    valueAtom.set(chars.join('').slice(0, lengthAtom()))
  }, `${idBase}.backspaceAt`)

  const moveBy = action((delta: number) => {
    activeIndexAtom.set(clampIndex(activeIndexAtom() + delta))
  }, `${idBase}.moveBy`)

  const moveFirst = action(() => {
    activeIndexAtom.set(0)
  }, `${idBase}.moveFirst`)

  const moveLast = action(() => {
    activeIndexAtom.set(lengthAtom() - 1)
  }, `${idBase}.moveLast`)

  const clear = action(() => {
    if (isBlocked()) return
    valueAtom.set('')
    activeIndexAtom.set(0)
  }, `${idBase}.clear`)

  const state: CodeInputState = {
    value: valueAtom,
    length: lengthAtom,
    activeIndex: activeIndexAtom,
    disabled: disabledAtom,
    readonly: readonlyAtom,
    required: requiredAtom,
    purpose,
    charset,
    mask,
    autocomplete,
    name,
    charAt(index: number) {
      return valueAtom()[index] ?? ''
    },
    isComplete() {
      return valueAtom().length === lengthAtom()
    },
  }

  const contracts: CodeInputContracts = {
    getGroupProps() {
      return {
        role: 'group',
        'aria-disabled': disabledAtom() ? 'true' : undefined,
        'aria-readonly': readonlyAtom() ? 'true' : undefined,
      }
    },
    getInputProps(index: number) {
      const safeIndex = clampIndex(index)
      const isDisabled = disabledAtom()
      const isReadonly = readonlyAtom()
      const isRequired = requiredAtom()

      return {
        id: `${idBase}-slot-${safeIndex + 1}`,
        value: valueAtom()[safeIndex] ?? '',
        type: mask ? 'password' : 'text',
        inputmode: charset === 'numeric' ? 'numeric' : 'text',
        autocomplete: safeIndex === 0 ? autocomplete : 'off',
        maxlength: lengthAtom(),
        tabindex: isDisabled ? '-1' : '0',
        'aria-label': `Code character ${safeIndex + 1} of ${lengthAtom()}`,
        'aria-disabled': isDisabled ? 'true' : undefined,
        'aria-readonly': isReadonly ? 'true' : undefined,
        'aria-required': isRequired ? 'true' : undefined,
        disabled: isDisabled || undefined,
        readonly: isReadonly || undefined,
        required: isRequired || undefined,
      }
    },
    getHiddenInputProps() {
      return {
        type: 'hidden',
        name: name || undefined,
        value: valueAtom(),
        disabled: disabledAtom() || undefined,
        required: requiredAtom() || undefined,
      }
    },
  }

  return {
    state,
    actions: {
      setValue,
      setLength,
      setDisabled,
      setReadonly,
      setRequired,
      setActiveIndex,
      inputAt,
      backspaceAt,
      moveBy,
      moveFirst,
      moveLast,
      clear,
    },
    contracts,
  }
}
