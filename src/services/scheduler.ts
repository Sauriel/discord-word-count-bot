import cron from 'node-cron';
import { Client } from 'discord.js';
import { Database } from 'sqlite';
import { TIMEZONE } from '../config/constants.js';
import { getDailyMessage, getWeeklyMessage } from '../database/queries.js';
import { sendMessageToChannels } from './messageHandler.js';

/**
 * Sendet die tägliche Zusammenfassung
 */
async function sendDailyMessage(client: Client, allowedChannels: string[], DB: Database): Promise<void> {
  const message = await getDailyMessage(DB);
  await sendMessageToChannels(client, allowedChannels, message);
}

/**
 * Sendet die wöchentliche Zusammenfassung
 */
async function sendWeeklyMessage(client: Client, allowedChannels: string[], DB: Database): Promise<void> {
  const message = await getWeeklyMessage(DB);
  await sendMessageToChannels(client, allowedChannels, message);
}

/**
 * Richtet alle Cron-Jobs ein
 */
export function setupSchedulers(client: Client, allowedChannels: string[], DB: Database): void {
  // Tägliche Zusammenfassung um 00:30
  cron.schedule('30 0 * * *', () => {
    console.log('Sending daily message...');
    sendDailyMessage(client, allowedChannels, DB);
  }, {
    timezone: TIMEZONE,
  });

  console.log('Daily message scheduler activated for 00:30');

  // Wöchentliche Zusammenfassung am Montag um 00:30
  cron.schedule('30 0 * * 1', () => {
    console.log('Sending weekly message...');
    sendWeeklyMessage(client, allowedChannels, DB);
  }, {
    timezone: TIMEZONE,
  });

  console.log('Weekly message scheduler activated for Monday 00:30');
}
