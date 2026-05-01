import { Client } from 'discord.js';

/**
 * Sendet eine Nachricht an alle konfigurierten Kanäle
 */
export async function sendMessageToChannels(
  client: Client, 
  allowedChannels: string[], 
  message: string
): Promise<void> {
  for (const channelId of allowedChannels) {
    try {
      const channel = await client.channels.fetch(channelId.trim());
      if (channel?.isTextBased() && 'send' in channel) {
        await channel.send(message);
        console.log(`Message sent to channel: ${channelId}`);
      }
    } catch (error) {
      console.error(`Failed to send message to channel ${channelId}:`, error);
    }
  }
}
