import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Database } from 'sqlite';
import { COMPLIMENTS } from '../config/constants.js';
import { getWordCount, updateWordCount, getUserGoal } from '../database/queries.js';
import { getTodayDateString, formatGermanDate } from '../utils/dateFormatter.js';

/**
 * Verarbeitet den /w Command - fügt Wörter zur Tagesanzahl hinzu
 */
export async function handleCountCommand(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const newCount = interaction.options.getInteger('anzahl', true);
  const user = interaction.user;

  const date = getTodayDateString();
  const germanDateFormat = formatGermanDate(new Date(date));

  const existingCount = await getWordCount(DB, user.id, date);
  const count = existingCount + newCount;
  
  await updateWordCount(DB, user.id, user.displayName, date, count);

  const userGoal = await getUserGoal(DB, user.id);
  const userGoalCount = userGoal ?? Number.MAX_VALUE;
  const goalMetMod = count / userGoalCount;

  let message = '';
  if (goalMetMod > 1) {
    message = `🎉 ${user.displayName} hat am ${germanDateFormat} das Tagesziel von ${userGoal} Wörtern erreicht! Insgesamt wurden ${count} Wörter geschrieben.`;
  } else {
    message = `${user.displayName} hat am ${germanDateFormat} insgesamt ${count} Wörter geschrieben.`;
  }

  await interaction.reply({
    content: message,
    flags: ['Ephemeral'],
  });

  // Motivationsspruch wenn Ziel erreicht
  if (goalMetMod > 1) {
    const motivationalQuote = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]
      .replace('{USER}', user.displayName);
    await interaction.followUp({
      content: motivationalQuote,
      flags: ['Ephemeral'],
    });
    
    // Extra Belohnung bei doppeltem Ziel
    if (goalMetMod >= 2) {
      try {
        const attachment = new AttachmentBuilder('https://media1.tenor.com/m/a9lDoOYyZikAAAAd/good-girl-atta-girl.gif');
        await interaction.followUp({
          content: "Wow, du hast dein Tagesziel weit übertroffen!",
          files: [attachment],
          flags: ['Ephemeral'],
        });
      } catch (error) {
        console.error('Failed to send congratulatory image:', error);
      }
    }
  }

  console.log(
    `User ${interaction.user.username} wrote ${newCount} words (${count} total, ${userGoal ?? 0} goal)`,
  );
}
