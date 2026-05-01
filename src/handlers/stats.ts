import { ChatInputCommandInteraction } from 'discord.js';
import { Database } from 'sqlite';
import { 
  getAllWordCountsForDate, 
  getAllUserGoals, 
  getTotalWordsForDate, 
  getWordCount, 
  getUserGoal 
} from '../database/queries.js';
import { getTodayDateString, formatGermanDate } from '../utils/dateFormatter.js';

/**
 * Verarbeitet den /wstat Command - zeigt Statistiken an
 */
export async function handleStatsCommand(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const type = interaction.options.getString('type');
  const date = getTodayDateString();
  const germanDateFormat = formatGermanDate(new Date(date));
  
  if (type === 'summary') {
    // Detaillierte Gruppenstatistik
    const stats = await getAllWordCountsForDate(DB, date);
    const goals = await getAllUserGoals(DB);

    let message = `**Detaillierte Statistik für ${germanDateFormat}:**\n`
                + '--------------------------------------------------------\n';

    stats.forEach((stat) => {
      const userGoal = goals.find((goal) => goal.user_id === stat.user_id);
      message += `**${stat.user_name}** hat **${stat.count}** Wörter geschrieben. *(Ziel: ${userGoal ? userGoal.goal : 0})*\n`;
    });

    await interaction.reply({
      content: message,
      flags: ['Ephemeral'],
    });
  } else if (type === 'detailed') {
    // Detaillierte Userstatistik
    const user = interaction.user;
    const totalWords = await getTotalWordsForDate(DB, date);
    const count = await getWordCount(DB, user.id, date);
    const userGoal = await getUserGoal(DB, user.id);

    let message = `Heute wurden insgesamt ${totalWords} Wörter geschrieben.\n`
                + `**Detaillierte Statistik für ${germanDateFormat}:**\n`
                + '--------------------------------------------------------\n'
                + `**${user.displayName}** hat **${count}** Wörter geschrieben. *(Ziel: ${userGoal ?? 0})*`;

    await interaction.reply({
      content: message,
      flags: ['Ephemeral'],
    });
  } else {
    // Einfache Statistik
    const totalWords = await getTotalWordsForDate(DB, date);
    await interaction.reply({
      content: `Heute wurden insgesamt ${totalWords} Wörter geschrieben.`,
      ephemeral: false,
    });
  }
}
