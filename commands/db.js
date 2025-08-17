import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// you would have to import / invoke this in another file
export async function getDB () {
  return open({
    filename: './database.sql',
    driver: sqlite3.cached.Database
  }).then(db => {
    db.run('CREATE TABLE IF NOT EXISTS word_counts (user_id TEXT, user_name TEXT, date TEXT, count INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS user_goals (user_id TEXT, goal INTEGER)');
    return db;
  });
}