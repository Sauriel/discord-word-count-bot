import { ChatInputCommandInteraction } from 'discord.js';
import { Database } from 'sqlite';
import { BRAG_SHAME_QUOTES } from '../config/constants.js';
import { getWordCount, getTotalWordsForUser } from '../database/queries.js';
import { getTodayDateString, formatGermanDate } from '../utils/dateFormatter.js';

/**
 * Verarbeitet den /wb Command - gebe mit den geschriebenen Wörtern an
 */
export async function handleBragCommand(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const type = interaction.options.getString('type') ?? 'today';
  const user = interaction.user;
  const date = getTodayDateString();
  const germanDateFormat = formatGermanDate(new Date(date));

  let message = '';

  if (type === 'today') {
    const count = await getWordCount(DB, user.id, date);
    message = `Am ${germanDateFormat} hat ${user.displayName} ${count} Wörter geschrieben.`;
  } else if (type === 'total') {
    const totalWords = await getTotalWordsForUser(DB, user.id);
    message = `Insgesamt hat ${user.displayName} ${totalWords} Wörter geschrieben.`;
  }

  await interaction.reply({
    content: message,
    ephemeral: false,
  });

  await interaction.followUp({
    content: BRAG_SHAME_QUOTES[Math.floor(Math.random() * BRAG_SHAME_QUOTES.length)],
    flags: ['Ephemeral'],
  });
}
