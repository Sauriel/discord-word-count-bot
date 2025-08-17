/**
 * @param {import('discord.js').ChatInputCommandInteraction<import('discord.js').CacheType>} interaction
 * @param {import('sqlite').Database} DB
 */
export async function count(interaction, DB) {
  // Implement the counting logic here
  const newCount = interaction.options.getInteger('anzahl');
  const user = interaction.user;

  const date = new Date().toISOString().slice(0, 10);

  // Update the database with the new word count
  let count = await DB.get('SELECT count FROM word_counts WHERE user_id = ? AND date = ?', [user.id, date]);
  if (count) {
    count = Number.parseInt(count.count, 10) + newCount;
    await DB.run('UPDATE word_counts SET count = ? WHERE user_id = ? AND date = ?', [count, user.id, date]);
  } else {
    count = newCount;
    await DB.run('INSERT INTO word_counts (user_id, user_name, count, date) VALUES (?, ?, ?, ?)', [user.id, user.displayName, count, date]);
  }

  const userGoal = await DB.get('SELECT goal FROM user_goals WHERE user_id = ?', [user.id]);

  let message = '';

  if (userGoal && Number.parseInt(userGoal.goal, 10) <= count) {
    message = `🎉 ${user.displayName} hat am ${date} das Tagesziel von ${userGoal.goal} Wörtern erreicht! Insgesamt wurden ${count} Wörter geschrieben.`;
  } else {
    message = `${user.displayName} hat am ${date} insgesamt ${count} Wörter geschrieben.`;
  }

  // Echo the number back
  await interaction.reply({
    content: message,
    ephemeral: true, // Set to true if you want only the user to see the response
  });

  console.log(
    `User ${interaction.user.username} wrote ${newCount} words (${count} total, ${userGoal ? userGoal.goal : 0} goal)`,
  );
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction<import('discord.js').CacheType>} interaction
 * @param {import('sqlite').Database} DB
 */
export async function setGoal(interaction, DB) {
  const goal = interaction.options.getInteger('anzahl');
  const user = interaction.user;

  // Update or insert the user's goal
  await DB.run('INSERT OR REPLACE INTO user_goals (user_id, goal) VALUES (?, ?)', [user.id, goal]);

  await interaction.reply({
    content: `${user.displayName} hat ein Tagesziel von ${goal} Wörtern gesetzt.`,
    ephemeral: true,
  });

  console.log(`User ${interaction.user.username} set a goal of ${goal} words`);
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction<import('discord.js').CacheType>} interaction
 * @param {import('sqlite').Database} DB
 */
export async function getStats(interaction, DB) {
  const type = interaction.options.getString('type');

  const date = new Date().toISOString().slice(0, 10);
  if (type === 'summary') {
    const stats = await DB.all('SELECT user_id, user_name, count FROM word_counts WHERE date = ?', [date]);
    const goals = await DB.all('SELECT user_id, goal FROM user_goals');

    let message = `**Detaillierte Statistik für ${date}:**\n`
                + '--------------------------------------------------------\n';

    stats.forEach((stat) => {
      const userGoal = goals.find((goal) => goal.user_id === stat.user_id);
      message += `**${stat.user_name}** hat **${stat.count}** Wörter geschrieben. *(Ziel: ${userGoal ? userGoal.goal : 0})*\n`;
    });

    await interaction.reply({
      content: message,
      ephemeral: true,
    });
  } else if (type === 'detailed') {
  const user = interaction.user;
    const totalWords = await DB.get('SELECT SUM(count) as total FROM word_counts WHERE date = ?', [date]);
    let count = await DB.get('SELECT count FROM word_counts WHERE user_id = ? AND date = ?', [user.id, date]);
    count = Number.parseInt(count.count, 10);
    const userGoal = await DB.get('SELECT goal FROM user_goals WHERE user_id = ?', [user.id]);

    let message = `Heute wurden insgesamt ${totalWords.total} Wörter geschrieben.\n`
                + `**Detaillierte Statistik für ${date}:**\n`
                + '--------------------------------------------------------\n'
                + `**${user.displayName}** hat **${count}** Wörter geschrieben. *(Ziel: ${userGoal ? userGoal.goal : 0})*`;

    await interaction.reply({
      content: message,
      ephemeral: true,
    });
  } else {
    const totalWords = await DB.get('SELECT SUM(count) as total FROM word_counts WHERE date = ?', [date]);
    await interaction.reply({
      content: `Heute wurden insgesamt ${totalWords.total} Wörter geschrieben.`,
      ephemeral: false,
    });
  }
}


/**
 * @param {import('sqlite').Database} DB
 * @returns {Promise<string>}
 */
export async function getDailyMessage(DB) {
  const date = new Date().toISOString().slice(0, 10);
  const totalWords = await DB.get('SELECT SUM(count) as total FROM word_counts WHERE date = ?', [date]);
  return `Heute wurden insgesamt ${totalWords.total} Wörter geschrieben.`;
}