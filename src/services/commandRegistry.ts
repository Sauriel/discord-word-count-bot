import { REST, Routes } from 'discord.js';
import { commands } from '../config/commands.js';

/**
 * Registriert alle Slash Commands bei Discord
 */
export async function registerCommands(token: string, appId: string): Promise<void> {
  try {
    const rest = new REST().setToken(token);

    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(appId), {
      body: commands.map((command) => command.toJSON()),
    });

    console.log('Successfully reloaded application (/) commands.');
  }
  catch (error) {
    console.error('Error registering commands:', error);
  }
}
