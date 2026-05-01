import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { Database } from 'sqlite';
import { formatShortGermanDate } from './dateFormatter.js';

interface DailyData {
  date: string;
  count: number;
}

/**
 * Erstellt ein Balkendiagramm für die wöchentliche Wortanzahl eines Benutzers
 */
export async function createWeeklyChart(
  DB: Database, 
  userId: string, 
  startDate: string, 
  endDate: string
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
  
  // Sammle Daten für jeden Tag
  const dailyData: DailyData[] = [];
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
  const labels = dailyData.map(d => formatShortGermanDate(new Date(d.date)));
  
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

/**
 * Erstellt ein Balkendiagramm für die gesamte wöchentliche Wortanzahl aller Benutzer
 */
export async function createTotalWeeklyChart(
  DB: Database, 
  startDate: string, 
  endDate: string
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
  
  // Sammle Daten für jeden Tag
  const dailyData: DailyData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateString = date.toLocaleDateString('sv-SE');
    const result = await DB.get<{ total: number }>(
      'SELECT SUM(count) as total FROM word_counts WHERE date = ?',
      [dateString]
    );
    dailyData.push({
      date: dateString,
      count: result?.total ?? 0
    });
  }
  
  // Erstelle Labels im deutschen Format
  const labels = dailyData.map(d => formatShortGermanDate(new Date(d.date)));
  
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

/**
 * Erstellt ein gestapeltes Balkendiagramm für die wöchentliche Wortanzahl eines Benutzers
 * Jeder Tag wird als separate Schicht gestapelt, um kumulative Fortschritte zu zeigen
 */
export async function createStackedWeeklyChart(
  DB: Database, 
  userId: string, 
  startDate: string, 
  endDate: string
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
  
  // Sammle Daten für jeden Tag
  const dailyData: DailyData[] = [];
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
  const labels = dailyData.map(d => formatShortGermanDate(new Date(d.date)));
  
  // Farben für jeden Tag
  const colors = [
    'rgba(88, 101, 242, 0.8)',   // Blau
    'rgba(254, 231, 92, 0.8)',   // Gelb
    'rgba(87, 242, 135, 0.8)',   // Grün
    'rgba(237, 66, 69, 0.8)',    // Rot
    'rgba(235, 69, 158, 0.8)',   // Pink
    'rgba(254, 159, 61, 0.8)',   // Orange
    'rgba(153, 170, 181, 0.8)'   // Grau
  ];
  
  // Erstelle ein Dataset für jeden Tag
  const datasets = dailyData.map((day, dayIndex) => ({
    label: labels[dayIndex],
    data: dailyData.map((_, index) => index >= dayIndex ? day.count : 0),
    backgroundColor: colors[dayIndex % colors.length],
    borderColor: colors[dayIndex % colors.length].replace('0.8', '1'),
    borderWidth: 1
  }));
  
  const configuration = {
    type: 'bar' as const,
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const
        }
      }
    }
  };
  
  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Erstellt ein gestapeltes Balkendiagramm für die gesamte wöchentliche Wortanzahl aller Benutzer
 * Jeder Tag wird als separate Schicht gestapelt, um kumulative Fortschritte zu zeigen
 */
export async function createStackedTotalWeeklyChart(
  DB: Database, 
  startDate: string, 
  endDate: string
): Promise<Buffer> {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
  
  // Sammle Daten für jeden Tag
  const dailyData: DailyData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateString = date.toLocaleDateString('sv-SE');
    const result = await DB.get<{ total: number }>(
      'SELECT SUM(count) as total FROM word_counts WHERE date = ?',
      [dateString]
    );
    dailyData.push({
      date: dateString,
      count: result?.total ?? 0
    });
  }
  
  // Erstelle Labels im deutschen Format
  const labels = dailyData.map(d => formatShortGermanDate(new Date(d.date)));
  
  // Farben für jeden Tag
  const colors = [
    'rgba(88, 101, 242, 0.8)',   // Blau
    'rgba(254, 231, 92, 0.8)',   // Gelb
    'rgba(87, 242, 135, 0.8)',   // Grün
    'rgba(237, 66, 69, 0.8)',    // Rot
    'rgba(235, 69, 158, 0.8)',   // Pink
    'rgba(254, 159, 61, 0.8)',   // Orange
    'rgba(153, 170, 181, 0.8)'   // Grau
  ];
  
  // Erstelle ein Dataset für jeden Tag
  const datasets = dailyData.map((day, dayIndex) => ({
    label: labels[dayIndex],
    data: dailyData.map((_, index) => index >= dayIndex ? day.count : 0),
    backgroundColor: colors[dayIndex % colors.length],
    borderColor: colors[dayIndex % colors.length].replace('0.8', '1'),
    borderWidth: 1
  }));
  
  const configuration = {
    type: 'bar' as const,
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const
        }
      }
    }
  };
  
  return await chartJSNodeCanvas.renderToBuffer(configuration);
}
