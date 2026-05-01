import { Client, GatewayIntentBits } from 'discord.js';
import { validateEnvironment } from './config/environment.js';
import { COMMAND_DESCRIPTIONS } from './config/constants.js';
import { getDB } from './database/db.js';
import { registerCommands } from './services/commandRegistry.js';
import { setupSchedulers } from './services/scheduler.js';
import { sendMessageToChannels } from './services/messageHandler.js';
import { handleCountCommand } from './handlers/count.js';
import { handleGoalCommand } from './handlers/goal.js';
import { handleStatsCommand } from './handlers/stats.js';
import { handleBragCommand } from './handlers/brag.js';
import { handleWeekStatsCommand, handleMyWeekStatsCommand } from './handlers/weekStats.js';

// Validiere Umgebungsvariablen und initialisiere Config
const config = validateEnvironment();

// Initialisiere Datenbank
const DB = await getDB();

// Erstelle Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Bot ist bereit
client.once('ready', async () => {
  console.log(`Ready! Logged in as ${client.user?.tag}`);
  
  // Registriere Commands bei Discord
  await registerCommands(config.discordToken, config.discordAppId);

  // Sende Commandliste an alle konfigurierten Kanäle
  await sendMessageToChannels(client, config.allowedChannels, COMMAND_DESCRIPTIONS.commandList);

  // Richte Cron-Jobs für tägliche und wöchentliche Nachrichten ein
  setupSchedulers(client, config.allowedChannels, DB);
});

// Command Handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'w':
        await handleCountCommand(interaction, DB);
        break;
      case 'wgoal':
        await handleGoalCommand(interaction, DB);
        break;
      case 'wstat':
        await handleStatsCommand(interaction, DB);
        break;
      case 'wb':
        await handleBragCommand(interaction, DB);
        break;
      case 'wweek':
        await handleWeekStatsCommand(interaction, DB);
        break;
      case 'wmyweek':
        await handleMyWeekStatsCommand(interaction, DB);
        break;
      default:
        console.warn(`Unknown command: ${commandName}`);
    }
  } catch (error) {
    console.error(`Error handling command ${commandName}:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        flags: ['Ephemeral'],
      });
    }
  }
});

// Error Handler
client.on('error', console.error);

// Login
client.login(config.discordToken);
