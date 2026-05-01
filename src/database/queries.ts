import { Database } from 'sqlite';
import { formatGermanDate, getYesterdayDateString } from '../utils/dateFormatter.js';

export interface WordCount {
  user_id: string;
  user_name: string;
  date: string;
  count: number;
}

export interface UserGoal {
  user_id: string;
  goal: number;
}

/**
 * Holt die Wortanzahl eines Benutzers für ein bestimmtes Datum
 */
export async function getWordCount(DB: Database, userId: string, date: string): Promise<number> {
  const result = await DB.get<{ count: number }>(
    'SELECT count FROM word_counts WHERE user_id = ? AND date = ?',
    [userId, date]
  );
  return result?.count ?? 0;
}

/**
 * Aktualisiert die Wortanzahl eines Benutzers für ein Datum
 */
export async function updateWordCount(
  DB: Database, 
  userId: string, 
  userName: string, 
  date: string, 
  count: number
): Promise<void> {
  const existingCount = await DB.get<{ count: number }>(
    'SELECT count FROM word_counts WHERE user_id = ? AND date = ?',
    [userId, date]
  );
  
  if (existingCount) {
    await DB.run(
      'UPDATE word_counts SET count = ? WHERE user_id = ? AND date = ?',
      [count, userId, date]
    );
  } else {
    await DB.run(
      'INSERT INTO word_counts (user_id, user_name, count, date) VALUES (?, ?, ?, ?)',
      [userId, userName, count, date]
    );
  }
}

/**
 * Holt das Tagesziel eines Benutzers
 */
export async function getUserGoal(DB: Database, userId: string): Promise<number | null> {
  const result = await DB.get<{ goal: number }>(
    'SELECT goal FROM user_goals WHERE user_id = ?',
    [userId]
  );
  return result?.goal ?? null;
}

/**
 * Setzt das Tagesziel eines Benutzers
 */
export async function setUserGoal(DB: Database, userId: string, goal: number): Promise<void> {
  await DB.run(
    'INSERT OR REPLACE INTO user_goals (user_id, goal) VALUES (?, ?)',
    [userId, goal]
  );
}

/**
 * Holt alle Wortanzahlen für ein bestimmtes Datum
 */
export async function getAllWordCountsForDate(DB: Database, date: string): Promise<WordCount[]> {
  return await DB.all<WordCount[]>(
    'SELECT user_id, user_name, count FROM word_counts WHERE date = ?',
    [date]
  );
}

/**
 * Holt alle Benutzerziele
 */
export async function getAllUserGoals(DB: Database): Promise<UserGoal[]> {
  return await DB.all<UserGoal[]>('SELECT user_id, goal FROM user_goals');
}

/**
 * Holt die Gesamtanzahl der Wörter für ein Datum
 */
export async function getTotalWordsForDate(DB: Database, date: string): Promise<number> {
  const result = await DB.get<{ total: number }>(
    'SELECT SUM(count) as total FROM word_counts WHERE date = ?',
    [date]
  );
  return result?.total ?? 0;
}

/**
 * Holt die Gesamtanzahl der Wörter für einen Benutzer
 */
export async function getTotalWordsForUser(DB: Database, userId: string): Promise<number> {
  const result = await DB.get<{ total: number }>(
    'SELECT SUM(count) as total FROM word_counts WHERE user_id = ?',
    [userId]
  );
  return result?.total ?? 0;
}

/**
 * Holt die Gesamtanzahl der Wörter für einen Zeitraum
 */
export async function getTotalWordsForPeriod(
  DB: Database, 
  startDate: string, 
  endDate: string
): Promise<number> {
  const result = await DB.get<{ total: number }>(
    'SELECT SUM(count) as total FROM word_counts WHERE date >= ? AND date <= ?',
    [startDate, endDate]
  );
  return result?.total ?? 0;
}

/**
 * Holt die Gesamtanzahl der Wörter für einen Benutzer in einem Zeitraum
 */
export async function getUserWordsForPeriod(
  DB: Database, 
  userId: string, 
  startDate: string, 
  endDate: string
): Promise<number> {
  const result = await DB.get<{ total: number }>(
    'SELECT SUM(count) as total FROM word_counts WHERE user_id = ? AND date >= ? AND date <= ?',
    [userId, startDate, endDate]
  );
  return result?.total ?? 0;
}

/**
 * Erstellt die tägliche Zusammenfassungsnachricht
 */
export async function getDailyMessage(DB: Database): Promise<string> {
  const date = getYesterdayDateString();
  const totalWords = await getTotalWordsForDate(DB, date);
  const germanDateFormat = formatGermanDate(new Date(date));
  return `Gestern (${germanDateFormat}) wurden insgesamt ${totalWords} Wörter geschrieben.`;
}

/**
 * Erstellt die wöchentliche Zusammenfassungsnachricht
 */
export async function getWeeklyMessage(DB: Database): Promise<string> {
  const endDate = getYesterdayDateString();
  const startDateObj = new Date(endDate);
  startDateObj.setDate(startDateObj.getDate() - 6);
  const startDate = startDateObj.toLocaleDateString('sv-SE');
  
  const totalWords = await getTotalWordsForPeriod(DB, startDate, endDate);
  
  const germanStartDate = formatGermanDate(new Date(startDate));
  const germanEndDate = formatGermanDate(new Date(endDate));
  
  return `📊 **Wöchentliche Zusammenfassung**\nIn den letzten 7 Tagen (${germanStartDate} - ${germanEndDate}) wurden insgesamt **${totalWords}** Wörter geschrieben!`;
}
