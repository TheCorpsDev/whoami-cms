/** Toast after a save, mentioning new machine translations or why they failed. */
export function savedMessage(isNew: boolean, warning: string | null | undefined, pendingBefore: number, pendingAfter: number): string {
  if (warning) return `Salvato. ${warning}`
  const base = isNew ? 'Voce aggiunta e pubblicata' : 'Modifiche salvate e pubblicate'
  return pendingAfter > pendingBefore ? `${base}: ${pendingAfter} ${pendingAfter === 1 ? 'testo tradotto' : 'testi tradotti'} in inglese da controllare` : base
}
