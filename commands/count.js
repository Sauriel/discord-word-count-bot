import { AttachmentBuilder } from 'discord.js';

const COMPLIMENTS = [
  "Fühlst du das kleine Lächeln auf deinen Lippen? Klopf dir selbst auf die Schulter! Das hast du großartig gemacht <3",
  "Und eine glückliche Ruhe kehrt in dich ein. Das ist das Gefühl von \"Wow. Ich hab es geschafft!\"",
  "Ich bin stolz auf dich. Und das darfst du auch sein!",
  "Morgen wieder hier? Gleiche Uhrzeit? Gleiche Stelle? Ich weiß, du kannst das schaffen!",
  "Toooor! Toooor! Und {USER} hat es geschafft! Die Menge jubelt!",
  "Wow. Du warst aber schnell unterwegs! Was bist, ein Wort-Sprinter?",
  "Wow. Du warst aber schnell unterwegs! Was bist, ein Marathonläufer?",
  "Du bist krass. Einfach krass.",
  "Wie du dein Leben auf die Reihe kriegst, so viel wie du schreibst... Beeindruckend!",
  "Jeder Schritt zählt!",
  "Jede Tagesetappe ist ein Stück näher am Ende der Geschichte!",
  "Du machst das großartig!"
];

/**
 * @param {import('discord.js').ChatInputCommandInteraction<import('discord.js').CacheType>} interaction
 * @param {import('sqlite').Database} DB
 */
export async function count(interaction, DB) {
  // Implement the counting logic here
  const newCount = interaction.options.getInteger('anzahl');
  const user = interaction.user;

  const date = new Date().toISOString().slice(0, 10);
  const germanDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));

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

  const userGoalCount = userGoal ? Number.parseInt(userGoal.goal, 10) : Number.MAX_VALUE;
  let message = '';
  let goalMetMod = count / userGoalCount;

  if (goalMetMod > 1) {
    message = `🎉 ${user.displayName} hat am ${germanDateFormat} das Tagesziel von ${userGoal.goal} Wörtern erreicht! Insgesamt wurden ${count} Wörter geschrieben.`;
  } else {
    message = `${user.displayName} hat am ${germanDateFormat} insgesamt ${count} Wörter geschrieben.`;
  }

  // Echo the number back
  await interaction.reply({
    content: message,
    ephemeral: true, // Set to true if you want only the user to see the response
  });

  if (goalMetMod > 1) {
    const motivationalQuote = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)].replace('{USER}', user.displayName);
    await interaction.followUp({
      content: motivationalQuote,
      ephemeral: true,
    });
    if (goalMetMod >= 2) {
      // wrote twice the goal
      try {
        const attachment = new AttachmentBuilder('https://media1.tenor.com/m/a9lDoOYyZikAAAAd/good-girl-atta-girl.gif')
        await interaction.followUp({
          content: "Wow, du hast dein Tagesziel weit übertroffen!",
          files: [attachment],
          ephemeral: true,
        });
      } catch (error) {
        console.error('Failed to send congratulatory image:', error);
      }
    }
  }

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
  const germanDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
  if (type === 'summary') {
    const stats = await DB.all('SELECT user_id, user_name, count FROM word_counts WHERE date = ?', [date]);
    const goals = await DB.all('SELECT user_id, goal FROM user_goals');

    let message = `**Detaillierte Statistik für ${germanDateFormat}:**\n`
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
                + `**Detaillierte Statistik für ${germanDateFormat}:**\n`
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
  const date = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString().slice(0, 10); // 12 Hours ago
  const totalWords = await DB.get('SELECT SUM(count) as total FROM word_counts WHERE date = ?', [date]);
  const germanDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
  return `Gestern (${germanDateFormat}) wurden insgesamt ${totalWords.total} Wörter geschrieben.`;
}

/**
 * @param {import('sqlite').Database} DB
 * @returns {Promise<string>}
 */
export async function getWeeklyMessage(DB) {
  // Calculate last 7 days (ending yesterday to avoid counting incomplete data for today)
  const endDate = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString().slice(0, 10); // 12 hours ago (yesterday)
  const startDateObj = new Date(endDate);
  startDateObj.setDate(startDateObj.getDate() - 6); // 6 days before yesterday = 7 days total
  const startDate = startDateObj.toISOString().slice(0, 10);
  
  const totalWords = await DB.get(
    'SELECT SUM(count) as total FROM word_counts WHERE date >= ? AND date <= ?',
    [startDate, endDate]
  );
  
  const germanStartDate = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(startDate));
  
  const germanEndDate = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(endDate));
  
  return `📊 **Wöchentliche Zusammenfassung**\nIn den letzten 7 Tagen (${germanStartDate} - ${germanEndDate}) wurden insgesamt **${totalWords.total || 0}** Wörter geschrieben!`;
}

const BRAG_SHAME_QUOTES = [
  '"Der Unterschied zwischen Angeberei und Ehrgeiz ist sehr gering." - *Shawn Corey Carter*',
  '"Prahlen sollst du erst auf dem Heimweg." - *Astrid Lindgren*',
  '"Es ist kein Angeben, wenn du es beweisen kannst." - *Muhammad Ali*',
  '"Angeben fühlt sich einfach gut an, man." - *The Weeknd*',
  '"Who knows himself a braggart, let him fear this, for it will come to pass that every braggart shall be found an ass." - *William Shakespeare*',
  '"Wenn du möchtest, dass die Leute gut von dir denken, dann sprich nicht gut von dir selbst." - *Blaise Pascal*',
  '"It will always sound like bragging to those who are slacking." - *Darnell Lamont Walker*',
];

/**
 * @param {import('discord.js').ChatInputCommandInteraction<import('discord.js').CacheType>} interaction
 * @param {import('sqlite').Database} DB
 */
export async function brag(interaction, DB) {
  const type = interaction.options.getString('type') ?? 'today'; // 'today' or  'total'

  const user = interaction.user;
  const date = new Date().toISOString().slice(0, 10);
  const germanDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
      day: '2-digit',
  }).format(new Date(date));

  let message = '';

  if (type === 'today') {
    const userStats = await DB.get('SELECT count FROM word_counts WHERE user_id = ? AND date = ?', [user.id, date]);
    message = `Am ${germanDateFormat} hat ${user.displayName} ${userStats.count} Wörter geschrieben.`
  } else if (type === 'total') {
    const totalWords = await DB.get('SELECT SUM(count) as total FROM word_counts WHERE user_id = ?', [user.id]);
    message = `Insgesamt hat ${user.displayName} ${totalWords.total} Wörter geschrieben.`;
  }

  await interaction.reply({
    content: message,
    ephemeral: false,
  });

  await interaction.followUp({
    content: BRAG_SHAME_QUOTES[Math.floor(Math.random() * BRAG_SHAME_QUOTES.length)],
    ephemeral: true,
  });
}

/**
 * Get the start date for the week based on type
 * @param {string} type - 'last7days' or 'thisweek'
 * @returns {string} ISO date string
 */
function getWeekStartDate(type) {
  const now = new Date();
  
  if (type === 'thisweek') {
    // Get last Monday at 00:00
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysToSubtract);
    lastMonday.setHours(0, 0, 0, 0);
    return lastMonday.toISOString().slice(0, 10);
  } else {
    // Last 7 days (including today)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    return sevenDaysAgo.toISOString().slice(0, 10);
  }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction<import('discord.js').CacheType>} interaction
 * @param {import('sqlite').Database} DB
 */
export async function getWeekStats(interaction, DB) {
  const type = interaction.options.getString('type') ?? 'last7days';
  
  const startDate = getWeekStartDate(type);
  const today = new Date().toISOString().slice(0, 10);
  
  const totalWords = await DB.get(
    'SELECT SUM(count) as total FROM word_counts WHERE date >= ? AND date <= ?',
    [startDate, today]
  );
  
  const germanStartDate = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(startDate));
  
  const germanEndDate = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(today));
  
  const periodText = type === 'thisweek' 
    ? `seit Montag (${germanStartDate})`
    : `in den letzten 7 Tagen (${germanStartDate} - ${germanEndDate})`;
  
  const message = `📊 Insgesamt wurden ${periodText} **${totalWords.total || 0}** Wörter geschrieben.`;
  
  await interaction.reply({
    content: message,
    ephemeral: false,
  });
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction<import('discord.js').CacheType>} interaction
 * @param {import('sqlite').Database} DB
 */
export async function getMyWeekStats(interaction, DB) {
  const type = interaction.options.getString('type') ?? 'last7days';
  const user = interaction.user;
  
  const startDate = getWeekStartDate(type);
  const today = new Date().toISOString().slice(0, 10);
  
  const userWords = await DB.get(
    'SELECT SUM(count) as total FROM word_counts WHERE user_id = ? AND date >= ? AND date <= ?',
    [user.id, startDate, today]
  );
  
  const germanStartDate = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(startDate));
  
  const germanEndDate = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(today));
  
  const periodText = type === 'thisweek' 
    ? `seit Montag (${germanStartDate})`
    : `in den letzten 7 Tagen (${germanStartDate} - ${germanEndDate})`;
  
  const message = `📊 **${user.displayName}**, du hast ${periodText} **${userWords.total || 0}** Wörter geschrieben.`;
  
  await interaction.reply({
    content: message,
    ephemeral: true,
  });
}