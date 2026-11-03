import { createContext, useContext } from 'react'
import { api } from '../lib/api'

/** Validation errors from the last save, keyed by Laravel field path. */
export const ErrorsContext = createContext<Record<string, string[]>>({})

/**
 * English texts filled in by DeepL that still need a look, and how to
 * approve one. Provided by the form that owns the draft.
 */
export const ReviewContext = createContext<{ pending: string[]; approve: (path: string) => void }>({ pending: [], approve: () => {} })

/** True when the server has a DeepL key and translates English on save. */
export const AutoTranslateContext = createContext(false)

export type Call = <T>(path: string, init?: RequestInit & { json?: unknown }) => Promise<T>

export const CallContext = createContext<Call>(api)

/**
 * API call for admin sections: a 401 means the session expired, so the
 * panel goes back to the login form instead of showing an error.
 */
export const useAdminApi = () => useContext(CallContext)

export const ToastContext = createContext<(text: string, error?: boolean) => void>(() => {})
export const useToast = () => useContext(ToastContext)
