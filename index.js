import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
 } from 'discord.js';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { count, setGoal, getStats, getDailyMessage, brag } from './commands/count.js';
import { getDB } from './commands/db.js';

dotenv.config();

const DB = await getDB();

/**
 * @type {Array<string>}
 */
const ALLOWED_CHANNELS = process.env.DISCORD_CHANNEL_IDS.split(',');

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Define the slash command
const commands = [
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
];

// Register slash commands
async function registerCommands() {
  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID), {
      body: commands.map((command) => command.toJSON()),
    });

    console.log('Successfully reloaded application (/) commands.');
  }
  catch (error) {
    console.error('Error registering commands:', error);
  }
}

async function sendDailyMessage() {
  const message = await getDailyMessage(DB);

  for (const channelId of ALLOWED_CHANNELS) {
    try {
      const channel = await client.channels.fetch(channelId.trim());
      if (channel && channel.isTextBased()) {
        await channel.send(message);
        console.log(`Daily message sent to channel: ${channelId}`);
      }
    } catch (error) {
      console.error(`Failed to send message to channel ${channelId}:`, error);
    }
  }
}

// When the client is ready, run this code
client.once('ready', async () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
  await registerCommands();

  const commandList = 'Der WordCountBot ist online. Folgende Befehle können verwendet werden:\n' +
                      '**/w [ZAHL]** - Anzahl der geschriebenen Wörter an diesem Tag (Wird addiert oder bei negativen Zahlen abgezogen)\n' +
                      '**/wgoal [ZAHL]** - Setze ein Tagesziel für die Anzahl der geschriebenen Wörter (Gilt für alle Tage)\n' +
                      '**/wstat** - Zeige Statistiken über die geschriebenen Wörter an\n' +
                      '**/wb** - Gebe mit deinen geschriebenen Wörtern an';

  for (const channelId of ALLOWED_CHANNELS) {
    try {
      const channel = await client.channels.fetch(channelId.trim());
      if (channel && channel.isTextBased()) {
        await channel.send(commandList);
        console.log(`Command list sent to channel: ${channelId}`);
      }
    } catch (error) {
      console.error(`Failed to send message to channel ${channelId}:`, error);
    }
  }

  // Schedule daily message at 00:30
  cron.schedule('30 0 * * *', () => {
    console.log('Sending daily message...');
    sendDailyMessage();
  }, {
    timezone: "Europe/Berlin" // Adjust timezone as needed
  });

  console.log('Daily message scheduler activated for 00:30');
});

// Listen for slash command interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

  if (commandName === 'w') {
    await count(interaction, DB);
  } else if (commandName === 'wgoal') {
    await setGoal(interaction, DB);
  } else if (commandName === 'wstat') {
    await getStats(interaction, DB);
  } else if (commandName === 'wb') {
    await brag(interaction, DB);
  }
});

// Error handling
client.on('error', console.error);

// Login to Discord with your client's token
if (!process.env.DISCORD_TOKEN) {
  console.error('Please set DISCORD_TOKEN in your .env file');
  process.exit(1);
}

if (!process.env.DISCORD_APP_ID) {
  console.error('Please set DISCORD_APP_ID in your .env file');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);