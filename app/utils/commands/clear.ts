import type { TerminalCommandHandler } from './types'
import { success } from './types'

export const clearCommand: TerminalCommandHandler = () => ({ ...success(), clear: true })
