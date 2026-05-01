import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('w')
    .setDescription('Anzahl der geschriebenen Wörter (negative Zahlen werden vom bislang geschriebenen abgezogen)')
    .addIntegerOption((option) =>
      option
        .setName('anzahl')
        .setDescription('Die Anzahl der Wörter')
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('wgoal')
    .setDescription('Setze ein Tagesziel für die Anzahl der geschriebenen Wörter')
    .addIntegerOption((option) =>
      option
        .setName('anzahl')
        .setDescription('Das Ziel für die Anzahl der Wörter')
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('wstat')
    .setDescription('Zeige Statistiken über die geschriebenen Wörter an')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Soll die Statistik detailliert angezeigt werden?')
        .addChoices(
          { name: 'Detailliert (User)', value: 'detailed' },
          { name: 'Detailliert (Gruppe)', value: 'summary' },
        )
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName('wb')
    .setDescription('Gebe mit deinen geschriebenen Wörtern an.')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Wie willst du angeben?')
        .addChoices(
          { name: 'Heute geschrieben', value: 'today' },
          { name: 'Insgesamt geschrieben', value: 'total' },
        )
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName('wweek')
    .setDescription('Zeige Statistiken über die in der Woche geschriebenen Wörter an (Gesamtstatistik)')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Welcher Zeitraum soll angezeigt werden?')
        .addChoices(
          { name: 'Letzte 7 Tage', value: 'last7days' },
          { name: 'Seit letztem Montag', value: 'thisweek' },
        )
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName('wmyweek')
    .setDescription('Zeige deine persönlichen Statistiken über die in der Woche geschriebenen Wörter an')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Welcher Zeitraum soll angezeigt werden?')
        .addChoices(
          { name: 'Letzte 7 Tage', value: 'last7days' },
          { name: 'Seit letztem Montag', value: 'thisweek' },
        )
        .setRequired(false),
    ),
];
