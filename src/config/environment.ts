import dotenv from 'dotenv';

dotenv.config();

export interface EnvironmentConfig {
  discordToken: string;
  discordAppId: string;
  allowedChannels: string[];
}

export function validateEnvironment(): EnvironmentConfig {
  if (!process.env.DISCORD_TOKEN) {
    console.error('Please set DISCORD_TOKEN in your .env file');
    process.exit(1);
  }

  if (!process.env.DISCORD_APP_ID) {
    console.error('Please set DISCORD_APP_ID in your .env file');
    process.exit(1);
  }

  return {
    discordToken: process.env.DISCORD_TOKEN,
    discordAppId: process.env.DISCORD_APP_ID,
    allowedChannels: process.env.DISCORD_CHANNEL_IDS?.split(',') ?? [],
  };
}
