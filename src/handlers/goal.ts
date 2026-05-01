import { ChatInputCommandInteraction } from 'discord.js';
import { Database } from 'sqlite';
import { setUserGoal } from '../database/queries.js';

/**
 * Verarbeitet den /wgoal Command - setzt das Tagesziel für einen Benutzer
 */
export async function handleGoalCommand(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const goal = interaction.options.getInteger('anzahl', true);
  const user = interaction.user;

  await setUserGoal(DB, user.id, goal);

  await interaction.reply({
    content: `${user.displayName} hat ein Tagesziel von ${goal} Wörtern gesetzt.`,
    flags: ['Ephemeral'],
  });

  console.log(`User ${interaction.user.username} set a goal of ${goal} words`);
}
