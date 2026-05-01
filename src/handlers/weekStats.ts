import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Database } from 'sqlite';
import { getTotalWordsForPeriod, getUserWordsForPeriod } from '../database/queries.js';
import { getWeekStartDate, getTodayDateString, formatGermanDate } from '../utils/dateFormatter.js';
import { createWeeklyChart, createTotalWeeklyChart, createStackedWeeklyChart, createStackedTotalWeeklyChart } from '../utils/chartGenerator.js';

/**
 * Verarbeitet den /wweek Command - zeigt Wochenstatistiken für alle Benutzer an
 */
export async function handleWeekStatsCommand(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const type = interaction.options.getString('type') ?? 'last7days';
  
  // Sofort acknowledgen, damit Discord nicht timeout wird
  await interaction.deferReply({ ephemeral: false });
  
  const startDate = getWeekStartDate(type);
  const today = getTodayDateString();
  
  // Erstelle beide Diagramme (kann länger als 3 Sekunden dauern)
  const chartBuffer = await createTotalWeeklyChart(DB, startDate, today);
  const stackedChartBuffer = await createStackedTotalWeeklyChart(DB, startDate, today);
  
  const attachment = new AttachmentBuilder(chartBuffer, { name: 'weekly-stats.png' });
  const stackedAttachment = new AttachmentBuilder(stackedChartBuffer, { name: 'weekly-stats-stacked.png' });
  
  const totalWords = await getTotalWordsForPeriod(DB, startDate, today);
  
  const germanStartDate = formatGermanDate(new Date(startDate));
  const germanEndDate = formatGermanDate(new Date(today));
  
  const periodText = type === 'thisweek' 
    ? `seit Montag (${germanStartDate})`
    : `in den letzten 7 Tagen (${germanStartDate} - ${germanEndDate})`;
  
  const message = `📊 Insgesamt wurden ${periodText} **${totalWords}** Wörter geschrieben.`;
  
  await interaction.editReply({
    content: message,
    files: [attachment, stackedAttachment],
  });
}

/**
 * Verarbeitet den /wmyweek Command - zeigt persönliche Wochenstatistiken mit Diagramm an
 */
export async function handleMyWeekStatsCommand(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const type = interaction.options.getString('type') ?? 'last7days';
  const user = interaction.user;
  
  // Sofort acknowledgen, damit Discord nicht timeout wird
  await interaction.deferReply({ ephemeral: true });
  
  const startDate = getWeekStartDate(type);
  const today = getTodayDateString();
  
  // Erstelle beide Diagramme (kann länger als 3 Sekunden dauern)
  const chartBuffer = await createWeeklyChart(DB, user.id, startDate, today);
  const stackedChartBuffer = await createStackedWeeklyChart(DB, user.id, startDate, today);
  
  const attachment = new AttachmentBuilder(chartBuffer, { name: 'weekly-stats.png' });
  const stackedAttachment = new AttachmentBuilder(stackedChartBuffer, { name: 'weekly-stats-stacked.png' });
  
  const userWords = await getUserWordsForPeriod(DB, user.id, startDate, today);
  
  const germanStartDate = formatGermanDate(new Date(startDate));
  const germanEndDate = formatGermanDate(new Date(today));
  
  const periodText = type === 'thisweek' 
    ? `seit Montag (${germanStartDate})`
    : `in den letzten 7 Tagen (${germanStartDate} - ${germanEndDate})`;
  
  const message = `📊 **${user.displayName}**, du hast ${periodText} **${userWords}** Wörter geschrieben.`;
  
  await interaction.editReply({
    content: message,
    files: [attachment, stackedAttachment],
  });
}
