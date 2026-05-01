import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Database } from 'sqlite';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

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
  "Du machst das großartig!",
];

export async function count(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const newCount = interaction.options.getInteger('anzahl', true);
  const user = interaction.user;

  const date = new Date().toLocaleDateString('sv-SE');
  const germanDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));

  let count: number;
  const existingCount = await DB.get<{ count: number }>('SELECT count FROM word_counts WHERE user_id = ? AND date = ?', [user.id, date]);
  
  if (existingCount) {
    count = existingCount.count + newCount;
    await DB.run('UPDATE word_counts SET count = ? WHERE user_id = ? AND date = ?', [count, user.id, date]);
  } else {
    count = newCount;
    await DB.run('INSERT INTO word_counts (user_id, user_name, count, date) VALUES (?, ?, ?, ?)', [user.id, user.displayName, count, date]);
  }

  const userGoal = await DB.get<{ goal: number }>('SELECT goal FROM user_goals WHERE user_id = ?', [user.id]);

  const userGoalCount = userGoal ? userGoal.goal : Number.MAX_VALUE;
  let message = '';
  const goalMetMod = count / userGoalCount;

  if (goalMetMod > 1) {
    message = `🎉 ${user.displayName} hat am ${germanDateFormat} das Tagesziel von ${userGoal?.goal} Wörtern erreicht! Insgesamt wurden ${count} Wörter geschrieben.`;
  } else {
    message = `${user.displayName} hat am ${germanDateFormat} insgesamt ${count} Wörter geschrieben.`;
  }

  await interaction.reply({
    content: message,
    flags: ['Ephemeral'],
  });

  if (goalMetMod > 1) {
    const motivationalQuote = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)].replace('{USER}', user.displayName);
    await interaction.followUp({
      content: motivationalQuote,
      flags: ['Ephemeral'],
    });
    if (goalMetMod >= 2) {
      try {
        const attachment = new AttachmentBuilder('https://media1.tenor.com/m/a9lDoOYyZikAAAAd/good-girl-atta-girl.gif');
        await interaction.followUp({
          content: "Wow, du hast dein Tagesziel weit übertroffen!",
          files: [attachment],
          flags: ['Ephemeral'],
        });
      } catch (error) {
        console.error('Failed to send congratulatory image:', error);
      }
    }
  }

  console.log(
    `User ${interaction.user.username} wrote ${newCount} words (${count} total, ${userGoal?.goal ?? 0} goal)`,
  );
}

export async function setGoal(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const goal = interaction.options.getInteger('anzahl', true);
  const user = interaction.user;

  await DB.run('INSERT OR REPLACE INTO user_goals (user_id, goal) VALUES (?, ?)', [user.id, goal]);

  await interaction.reply({
    content: `${user.displayName} hat ein Tagesziel von ${goal} Wörtern gesetzt.`,
    flags: ['Ephemeral'],
  });

  console.log(`User ${interaction.user.username} set a goal of ${goal} words`);
}

export async function getStats(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const type = interaction.options.getString('type');

  const date = new Date().toLocaleDateString('sv-SE');
  const germanDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
  
  if (type === 'summary') {
    const stats = await DB.all<Array<{ user_id: string; user_name: string; count: number }>>('SELECT user_id, user_name, count FROM word_counts WHERE date = ?', [date]);
    const goals = await DB.all<Array<{ user_id: string; goal: number }>>('SELECT user_id, goal FROM user_goals');

    let message = `**Detaillierte Statistik für ${germanDateFormat}:**\n`
                + '--------------------------------------------------------\n';

    stats.forEach((stat) => {
      const userGoal = goals.find((goal) => goal.user_id === stat.user_id);
      message += `**${stat.user_name}** hat **${stat.count}** Wörter geschrieben. *(Ziel: ${userGoal ? userGoal.goal : 0})*\n`;
    });

    await interaction.reply({
      content: message,
      flags: ['Ephemeral'],
    });
  } else if (type === 'detailed') {
    const user = interaction.user;
    const totalWords = await DB.get<{ total: number }>('SELECT SUM(count) as total FROM word_counts WHERE date = ?', [date]);
    const countResult = await DB.get<{ count: number }>('SELECT count FROM word_counts WHERE user_id = ? AND date = ?', [user.id, date]);
    const count = countResult?.count ?? 0;
    const userGoal = await DB.get<{ goal: number }>('SELECT goal FROM user_goals WHERE user_id = ?', [user.id]);

    let message = `Heute wurden insgesamt ${totalWords?.total ?? 0} Wörter geschrieben.\n`
                + `**Detaillierte Statistik für ${germanDateFormat}:**\n`
                + '--------------------------------------------------------\n'
                + `**${user.displayName}** hat **${count}** Wörter geschrieben. *(Ziel: ${userGoal?.goal ?? 0})*`;

    await interaction.reply({
      content: message,
      flags: ['Ephemeral'],
    });
  } else {
    const totalWords = await DB.get<{ total: number }>('SELECT SUM(count) as total FROM word_counts WHERE date = ?', [date]);
    await interaction.reply({
      content: `Heute wurden insgesamt ${totalWords?.total ?? 0} Wörter geschrieben.`,
      ephemeral: false,
    });
  }
}

export async function getDailyMessage(DB: Database): Promise<string> {
  const date = new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleDateString('sv-SE');
  const totalWords = await DB.get<{ total: number }>('SELECT SUM(count) as total FROM word_counts WHERE date = ?', [date]);
  const germanDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
  return `Gestern (${germanDateFormat}) wurden insgesamt ${totalWords?.total ?? 0} Wörter geschrieben.`;
}

export async function getWeeklyMessage(DB: Database): Promise<string> {
  const endDate = new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleDateString('sv-SE');
  const startDateObj = new Date(endDate);
  startDateObj.setDate(startDateObj.getDate() - 6);
  const startDate = startDateObj.toLocaleDateString('sv-SE');
  
  const totalWords = await DB.get<{ total: number }>(
    'SELECT SUM(count) as total FROM word_counts WHERE date >= ? AND date <= ?',
    [startDate, endDate],
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
  
  return `📊 **Wöchentliche Zusammenfassung**\nIn den letzten 7 Tagen (${germanStartDate} - ${germanEndDate}) wurden insgesamt **${totalWords?.total ?? 0}** Wörter geschrieben!`;
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

export async function brag(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const type = interaction.options.getString('type') ?? 'today';

  const user = interaction.user;
  const date = new Date().toLocaleDateString('sv-SE');
  const germanDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));

  let message = '';

  if (type === 'today') {
    const userStats = await DB.get<{ count: number }>('SELECT count FROM word_counts WHERE user_id = ? AND date = ?', [user.id, date]);
    message = `Am ${germanDateFormat} hat ${user.displayName} ${userStats?.count ?? 0} Wörter geschrieben.`;
  } else if (type === 'total') {
    const totalWords = await DB.get<{ total: number }>('SELECT SUM(count) as total FROM word_counts WHERE user_id = ?', [user.id]);
    message = `Insgesamt hat ${user.displayName} ${totalWords?.total ?? 0} Wörter geschrieben.`;
  }

  await interaction.reply({
    content: message,
    ephemeral: false,
  });

  await interaction.followUp({
    content: BRAG_SHAME_QUOTES[Math.floor(Math.random() * BRAG_SHAME_QUOTES.length)],
    flags: ['Ephemeral'],
  });
}

function getWeekStartDate(type: string): string {
  const now = new Date();
  
  if (type === 'thisweek') {
    const dayOfWeek = now.getDay();
    // Berechne Tage zurück zum Montag: Montag=0, Dienstag=1, ..., Sonntag=6
    const daysToSubtract = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToSubtract);
    monday.setHours(0, 0, 0, 0);
    // Verwende lokales Datum statt UTC um Zeitzonenprobleme zu vermeiden
    return monday.toLocaleDateString('sv-SE'); // Format: YYYY-MM-DD
  } else {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    return sevenDaysAgo.toLocaleDateString('sv-SE'); // Format: YYYY-MM-DD
  }
}

export async function getWeekStats(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const type = interaction.options.getString('type') ?? 'last7days';
  
  const startDate = getWeekStartDate(type);
  const today = new Date().toLocaleDateString('sv-SE');
  
  const totalWords = await DB.get<{ total: number }>(
    'SELECT SUM(count) as total FROM word_counts WHERE date >= ? AND date <= ?',
    [startDate, today],
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
  
  const message = `📊 Insgesamt wurden ${periodText} **${totalWords?.total ?? 0}** Wörter geschrieben.`;
  
  await interaction.reply({
    content: message,
    ephemeral: false,
  });
}

async function createWeeklyChart(
  DB: Database, 
  userId: string, 
  startDate: string, 
  endDate: string
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
  
  // Sammle Daten für jeden Tag
  const dailyData: { date: string; count: number }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateString = date.toLocaleDateString('sv-SE');
    const result = await DB.get<{ count: number }>(
      'SELECT count FROM word_counts WHERE user_id = ? AND date = ?',
      [userId, dateString]
    );
    dailyData.push({
      date: dateString,
      count: result?.count ?? 0
    });
  }
  
  // Erstelle Labels im deutschen Format
  const labels = dailyData.map(d => {
    const date = new Date(d.date);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  });
  
  const configuration = {
    type: 'bar' as const,
    data: {
      labels: labels,
      datasets: [{
        label: 'Wörter',
        data: dailyData.map(d => d.count),
        backgroundColor: 'rgba(88, 101, 242, 0.8)',
        borderColor: 'rgba(88, 101, 242, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  };
  
  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

export async function getMyWeekStats(interaction: ChatInputCommandInteraction, DB: Database): Promise<void> {
  const type = interaction.options.getString('type') ?? 'last7days';
  const user = interaction.user;
  
  // Sofort acknowledgen, damit Discord nicht timeout wird
  await interaction.deferReply({ ephemeral: true });
  
  const startDate = getWeekStartDate(type);
  const today = new Date().toLocaleDateString('sv-SE');
  
  // Erstelle das Diagramm (kann länger als 3 Sekunden dauern)
  const chartBuffer = await createWeeklyChart(DB, user.id, startDate, today);
  const attachment = new AttachmentBuilder(chartBuffer, { name: 'weekly-stats.png' });
  
  const userWords = await DB.get<{ total: number }>(
    'SELECT SUM(count) as total FROM word_counts WHERE user_id = ? AND date >= ? AND date <= ?',
    [user.id, startDate, today],
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
  
  const message = `📊 **${user.displayName}**, du hast ${periodText} **${userWords?.total ?? 0}** Wörter geschrieben.`;
  
  await interaction.editReply({
    content: message,
    files: [attachment],
  });
}
