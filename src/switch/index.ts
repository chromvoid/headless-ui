import {action, atom, type Atom} from '@reatom/core'

export interface CreateSwitchOptions {
  idBase?: string
  isOn?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  onCheckedChange?: (value: boolean) => void
}

export interface SwitchState {
  isOn: Atom<boolean>
  isDisabled: Atom<boolean>
  isLoading: Atom<boolean>
}

type SwitchKeyDownEvent = Pick<KeyboardEvent, 'key' | 'preventDefault'> &
  Partial<Pick<KeyboardEvent, 'defaultPrevented' | 'ctrlKey' | 'metaKey' | 'altKey'>>

export interface SwitchActions {
  setOn(value: boolean): void
  setDisabled(value: boolean): void
  setLoading(value: boolean): void
  toggle(): void
  handleClick(): void
  handleKeyDown(event: SwitchKeyDownEvent): void
}

export interface SwitchProps {
  id: string
  role: 'switch'
  tabindex: '0' | '-1'
  'aria-checked': 'true' | 'false'
  'aria-disabled': 'true' | 'false'
  'aria-busy'?: 'true'
  'aria-labelledby'?: string
  'aria-describedby'?: string
  onClick: () => void
  onKeyDown: (event: SwitchKeyDownEvent) => void
}

export interface SwitchContracts {
  getSwitchProps(): SwitchProps
}

export interface SwitchModel {
  readonly state: SwitchState
  readonly actions: SwitchActions
  readonly contracts: SwitchContracts
}

const isSpaceKey = (key: string) => key === ' ' || key === 'Spacebar'

export function createSwitch(options: CreateSwitchOptions = {}): SwitchModel {
  const idBase = options.idBase ?? 'switch'
  const isOnAtom = atom(options.isOn ?? false, `${idBase}.isOn`)
  const isDisabledAtom = atom(options.isDisabled ?? false, `${idBase}.isDisabled`)
  const isLoadingAtom = atom(options.isLoading ?? false, `${idBase}.isLoading`)

  const setOn = action((value: boolean) => {
    isOnAtom.set(value)
    options.onCheckedChange?.(value)
  }, `${idBase}.setOn`)

  const setDisabled = action((value: boolean) => {
    isDisabledAtom.set(value)
  }, `${idBase}.setDisabled`)

  const setLoading = action((value: boolean) => {
    isLoadingAtom.set(value)
  }, `${idBase}.setLoading`)

  const isInteractionBlocked = () => isDisabledAtom() || isLoadingAtom()

  const toggle = action(() => {
    if (isInteractionBlocked()) return
    setOn(!isOnAtom())
  }, `${idBase}.toggle`)

  const handleClick = action(() => {
    toggle()
  }, `${idBase}.handleClick`)

  const handleKeyDown = action((event: SwitchKeyDownEvent) => {
    if (isInteractionBlocked()) return
    if (event.defaultPrevented) return
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (event.key === 'Enter' || isSpaceKey(event.key)) {
      event.preventDefault()
      toggle()
    }
  }, `${idBase}.handleKeyDown`)

  const actions: SwitchActions = {
    setOn,
    setDisabled,
    setLoading,
    toggle,
    handleClick,
    handleKeyDown,
  }

  const contracts: SwitchContracts = {
    getSwitchProps() {
      const isUnavailable = isDisabledAtom() || isLoadingAtom()

      return {
        id: `${idBase}-root`,
        role: 'switch',
        tabindex: isUnavailable ? '-1' : '0',
        'aria-checked': isOnAtom() ? 'true' : 'false',
        'aria-disabled': isUnavailable ? 'true' : 'false',
        'aria-busy': isLoadingAtom() ? 'true' : undefined,
        'aria-labelledby': options.ariaLabelledBy,
        'aria-describedby': options.ariaDescribedBy,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
      }
    },
  }

  const state: SwitchState = {
    isOn: isOnAtom,
    isDisabled: isDisabledAtom,
    isLoading: isLoadingAtom,
  }

  return {
    state,
    actions,
    contracts,
  }
}
