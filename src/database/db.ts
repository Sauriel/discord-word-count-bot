import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

/**
 * Initialisiert und gibt die Datenbankverbindung zurück
 */
export async function getDB(): Promise<Database> {
  return open({
    filename: './database.sql',
    driver: sqlite3.cached.Database,
  }).then(db => {
    db.run('CREATE TABLE IF NOT EXISTS word_counts (user_id TEXT, user_name TEXT, date TEXT, count INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS user_goals (user_id TEXT, goal INTEGER)');
    return db;
  });
}
