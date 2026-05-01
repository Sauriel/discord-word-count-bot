/**
 * Formatiert ein Datum ins deutsche Format (DD.MM.YYYY)
 */
export function formatGermanDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Formatiert ein Datum ins kurze deutsche Format (DD.MM)
 */
export function formatShortGermanDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

/**
 * Gibt das heutige Datum im schwedischen Format zurück (YYYY-MM-DD)
 * Wird für die Datenbank verwendet
 */
export function getTodayDateString(): string {
  return new Date().toLocaleDateString('sv-SE');
}

/**
 * Berechnet den Startdatum für Wochenstatistiken
 * @param type - 'thisweek' für seit Montag, 'last7days' für die letzten 7 Tage
 */
export function getWeekStartDate(type: string): string {
  const now = new Date();
  
  if (type === 'thisweek') {
    const dayOfWeek = now.getDay();
    // Berechne Tage zurück zum Montag: Montag=0, Dienstag=1, ..., Sonntag=6
    const daysToSubtract = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToSubtract);
    monday.setHours(0, 0, 0, 0);
    return monday.toLocaleDateString('sv-SE');
  } else {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    return sevenDaysAgo.toLocaleDateString('sv-SE');
  }
}

/**
 * Gibt das gestrige Datum zurück (12 Stunden zurück von jetzt)
 * Wird für tägliche Zusammenfassungen verwendet
 */
export function getYesterdayDateString(): string {
  return new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleDateString('sv-SE');
}
