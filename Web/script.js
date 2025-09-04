document.addEventListener('DOMContentLoaded', function () {

  const palette = {
    teal: '#00F5D4',
    purple: '#9B5DE5',
    pink: '#F15BB5',
    yellow: '#FEE440',
    darkTeal: '#00CCBF',
    white: '#FFFFFF',
    gray: '#9CA3AF'
  };

  const processLabel = (label, maxLength = 16) => {
    if (label.length <= maxLength) return label;
    const words = label.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > maxLength) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = (currentLine + ' ' + word).trim();
      }
    }
    if (currentLine) lines.push(currentLine.trim());
    return lines;
  };

  const tooltipTitleCallback = (tooltipItems) => {
    const item = tooltipItems[0];
    let label = item.chart.data.labels[item.dataIndex];
    if (Array.isArray(label)) {
      return label.join(' ');
    } else {
      return label;
    }
  };

  const defaultChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: palette.white,
          font: { size: 14 }
        }
      },
      tooltip: {
        callbacks: {
          title: tooltipTitleCallback
        }
      }
    }
  };

  const timelineCtx = document.getElementById('timelineChart').getContext('2d');
  new Chart(timelineCtx, {
    type: 'bar',
    data: {
      labels: [
        'Integração Bluetooth com ESP32',
        'Implementação de leitura RFID',
        'Criação da interface (UI/UX)',
        'Implementação do dashboard e histórico',
        'Persistência de dados com SQLite',
        'Testes e ajustes finais'
      ].map(label => processLabel(label)),
      datasets: [{
        label: 'Dias Estimados',
        data: [2, 1, 2, 1, 1, 1],
        backgroundColor: [palette.teal, palette.purple, palette.pink, palette.yellow, palette.darkTeal, palette.gray],
        borderColor: '#111827',
        borderWidth: 2
      }]
    },
    options: {
      ...defaultChartOptions,
      indexAxis: 'y',
      scales: {
        y: {
          ticks: { color: palette.white, font: { size: 12 } },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        x: {
          ticks: { color: palette.white, font: { size: 12 } },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      },
      plugins: {
        ...defaultChartOptions.plugins,
        legend: { display: false }
      }
    }
  });

  const teamCtx = document.getElementById('teamChart').getContext('2d');
  new Chart(teamCtx, {
    type: 'doughnut',
    data: {
      labels: ['Gabriel (Bluetooth)', 'Breno (RFID)', 'Luis (UI/UX)', 'Luis (Dashboard)', 'Gabriel (SQLite)', 'Equipe (Testes)'],
      datasets: [{
        label: 'Dias de Trabalho',
        data: [2, 1, 2, 1, 1, 1],
        backgroundColor: [palette.teal, palette.purple, palette.pink, palette.yellow, palette.darkTeal, palette.gray],
        borderColor: '#1f2937',
        borderWidth: 4,
        hoverOffset: 4
      }]
    },
    options: defaultChartOptions
  });

  const mvpCtx = document.getElementById('mvpChart').getContext('2d');
  new Chart(mvpCtx, {
    type: 'pie',
    data: {
      labels: ['Conexão Bluetooth', 'Validação RFID', 'Feedback em Tempo Real', 'Registro Local de Eventos'],
      datasets: [{
        label: 'Funcionalidades Essenciais',
        data: [25, 25, 25, 25],
        backgroundColor: [palette.teal, palette.purple, palette.pink, palette.yellow],
        borderColor: '#1f2937',
        borderWidth: 4,
        hoverOffset: 4
      }]
    },
    options: defaultChartOptions
  });
});