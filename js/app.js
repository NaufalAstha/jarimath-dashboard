(function () {
  const logoutButton = document.getElementById('logout-button');
  const dashboardMessage = document.getElementById('dashboard-message');
  const accountEmail = document.getElementById('account-email');
  const viewContainer = document.getElementById('view-container');
  const dataDialog = document.getElementById('data-dialog');
  const dataForm = document.getElementById('data-form');
  const dialogFields = document.getElementById('dialog-fields');
  const demoModeKey = 'jarimath-demo-mode';
  const loginMessageKey = 'jarimath-login-message';
  const storageKeys = {
    siswa: 'jarimath-demo-siswa',
    mentor: 'jarimath-demo-mentor',
    keuangan: 'jarimath-demo-keuangan'
  };
  const initialData = {
    siswa: [
      { id: 's-1', nama: 'Alya Putri', kelas: 'Matematika dasar', status: 'Aktif' },
      { id: 's-2', nama: 'Rafi Pratama', kelas: 'Berhitung ceria', status: 'Aktif' },
      { id: 's-3', nama: 'Nadia Zahra', kelas: 'Matematika dasar', status: 'Menunggu' }
    ],
    mentor: [
      { id: 'm-1', nama: 'Kak Dinda', keahlian: 'Matematika dasar', status: 'Aktif' },
      { id: 'm-2', nama: 'Kak Fajar', keahlian: 'Berhitung ceria', status: 'Aktif' }
    ],
    keuangan: [
      { id: 'k-1', deskripsi: 'Pembayaran kelas Alya', jenis: 'Pemasukan', jumlah: 350000, tanggal: '2026-10-02' },
      { id: 'k-2', deskripsi: 'Perlengkapan belajar', jenis: 'Pengeluaran', jumlah: 75000, tanggal: '2026-10-05' },
      { id: 'k-3', deskripsi: 'Pembayaran kelas Rafi', jenis: 'Pemasukan', jumlah: 350000, tanggal: '2026-10-08' }
    ]
  };
  let storageWarning = false;
  let data = loadData();
  let currentView = document.body.dataset.page;
  let editing = null;

  const currentYear = document.querySelector('[data-current-year]');
  if (currentYear) currentYear.textContent = new Date().getFullYear();
  const todayDate = document.getElementById('today-date');
  if (todayDate) todayDate.textContent = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());

  function loadData() {
    const result = {};
    Object.keys(initialData).forEach(function (key) {
      try {
        const stored = localStorage.getItem(storageKeys[key]);
        result[key] = stored === null ? initialData[key].map(function (item) {
          return Object.assign({}, item);
        }) : JSON.parse(stored);
        if (!Array.isArray(result[key])) throw new Error('Format data tidak valid');
      } catch {
        result[key] = initialData[key].map(function (item) {
          return Object.assign({}, item);
        });
        storageWarning = true;
      }
    });
    return result;
  }

  function saveData(key) {
    try {
      localStorage.setItem(storageKeys[key], JSON.stringify(data[key]));
      return true;
    } catch {
      dashboardMessage.textContent = 'Perubahan hanya tersimpan sementara karena penyimpanan browser tidak tersedia.';
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  }

  function showDashboard(user, isDemo) {
    accountEmail.textContent = isDemo ? 'Mode demo · data lokal' : (user.email || '');
    dashboardMessage.textContent = storageWarning
      ? 'Data demo tidak dapat dibaca. Data contoh sementara digunakan.'
      : '';
    renderView();
  }

  function renderDashboard() {
    const income = data.keuangan.filter(function (item) { return item.jenis === 'Pemasukan'; })
      .reduce(function (sum, item) { return sum + Number(item.jumlah); }, 0);
    const expense = data.keuangan.filter(function (item) { return item.jenis === 'Pengeluaran'; })
      .reduce(function (sum, item) { return sum + Number(item.jumlah); }, 0);
    document.getElementById('student-count').textContent = data.siswa.length;
    document.getElementById('mentor-count').textContent = data.mentor.filter(function (item) {
      return item.status === 'Aktif';
    }).length;
    document.getElementById('recorded-balance').textContent = formatCurrency(income - expense);
    document.getElementById('activity-table-body').innerHTML = data.keuangan.slice().reverse().slice(0, 5)
      .map(function (item) {
        return '<tr><td>' + escapeHTML(item.deskripsi) + '</td><td>' + escapeHTML(item.tanggal) + '</td><td>'
          + escapeHTML(item.jenis) + '</td><td>' + escapeHTML(formatCurrency(item.jumlah)) + '</td></tr>';
      }).join('');
    renderDashboardChart();
  }

  function renderDashboardChart() {
    const selector = document.getElementById('dashboard-chart-metric');
    const chart = document.getElementById('dashboard-chart');
    const description = document.getElementById('dashboard-chart-description');
    const note = document.getElementById('dashboard-chart-note');
    if (!selector || !chart || !description || !note) return;

    const metric = selector.value;
    const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short' });
    const metrics = {
      murid: {
        description: 'Jumlah murid yang terdaftar menurut status saat ini.',
        note: 'Jumlah murid terdaftar saat ini berdasarkan status.',
        color: '#526779',
        values: [
          { label: 'Aktif', value: data.siswa.filter(function (student) { return student.status === 'Aktif'; }).length },
          { label: 'Menunggu', value: data.siswa.filter(function (student) { return student.status === 'Menunggu'; }).length }
        ]
      },
      revenue: {
        description: 'Total pemasukan dari transaksi per bulan dalam 6 bulan terakhir.',
        note: 'Revenue dihitung dari transaksi berjenis pemasukan.',
        color: '#547b68',
        values: [],
        kind: 'currency'
      },
      margin: {
        description: 'Margin profit bulanan dalam 6 bulan terakhir.',
        note: 'Margin profit = (revenue - cost) / revenue. Bulan tanpa revenue ditampilkan sebagai —.',
        color: '#7c6a9a',
        values: [],
        kind: 'percent'
      },
      cost: {
        description: 'Total pengeluaran dari transaksi per bulan dalam 6 bulan terakhir.',
        note: 'Cost dihitung dari transaksi berjenis pengeluaran.',
        color: '#a06c58',
        values: [],
        kind: 'currency'
      }
    };
    const selectedMetric = metrics[metric] || metrics.murid;
    description.textContent = selectedMetric.description;
    note.textContent = selectedMetric.note;

    if (metric !== 'murid') {
      const today = new Date();
      const months = [];
      for (let offset = 5; offset >= 0; offset -= 1) {
        const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
        const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        months.push({ key: key, label: monthFormatter.format(date) });
      }
      const totalsByMonth = {};
      data.keuangan.forEach(function (transaction) {
        const key = String(transaction.tanggal || '').slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(key)) return;
        if (!totalsByMonth[key]) totalsByMonth[key] = { revenue: 0, cost: 0 };
        if (transaction.jenis === 'Pemasukan') {
          totalsByMonth[key].revenue += Number(transaction.jumlah) || 0;
        } else if (transaction.jenis === 'Pengeluaran') {
          totalsByMonth[key].cost += Number(transaction.jumlah) || 0;
        }
      });
      selectedMetric.values = months.map(function (month) {
        const totals = totalsByMonth[month.key] || { revenue: 0, cost: 0 };
        let value;
        if (metric === 'revenue') value = totals.revenue;
        else if (metric === 'cost') value = totals.cost;
        else value = totals.revenue ? (totals.revenue - totals.cost) / totals.revenue * 100 : null;
        return { label: month.label, value: value };
      });
    }

    chart.innerHTML = renderBarChart(selectedMetric.values, selectedMetric);
  }

  function renderBarChart(values, metric) {
    const width = 760;
    const height = 300;
    const left = 78;
    const right = 20;
    const top = 24;
    const bottom = 48;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const finiteValues = values.map(function (item) { return item.value; })
      .filter(function (value) { return Number.isFinite(value); });
    let minimum = Math.min(0, ...finiteValues);
    let maximum = Math.max(0, ...finiteValues);
    if (minimum === maximum) maximum = minimum + 1;
    const padding = (maximum - minimum) * 0.08;
    if (minimum < 0) minimum -= padding;
    if (maximum > 0) maximum += padding;
    const zeroY = top + (maximum / (maximum - minimum)) * plotHeight;
    const stepX = plotWidth / values.length;
    const barWidth = Math.min(54, stepX * 0.48);
    const axisLabel = function (value) {
      if (metric.kind === 'currency') {
        return 'Rp' + new Intl.NumberFormat('id-ID', {
          notation: 'compact', maximumFractionDigits: 1
        }).format(value);
      }
      return metric.kind === 'percent' ? Math.round(value) + '%' : Math.round(value).toString();
    };
    const valueLabel = function (value) {
      if (value === null) return '—';
      if (metric.kind === 'currency') return formatCurrency(value);
      return metric.kind === 'percent' ? value.toFixed(1) + '%' : String(value);
    };
    let svg = '<svg class="dashboard-chart-svg" viewBox="0 0 ' + width + ' ' + height
      + '" role="img" aria-label="Grafik ' + escapeHTML(metric.description) + '">';
    for (let index = 0; index <= 4; index += 1) {
      const value = maximum - (maximum - minimum) * index / 4;
      const y = top + plotHeight * index / 4;
      svg += '<line class="chart-gridline" x1="' + left + '" y1="' + y + '" x2="' + (width - right)
        + '" y2="' + y + '"></line><text class="chart-axis-label" x="' + (left - 10) + '" y="' + (y + 4)
        + '" text-anchor="end">' + escapeHTML(axisLabel(value)) + '</text>';
    }
    svg += '<line class="chart-baseline" x1="' + left + '" y1="' + zeroY + '" x2="' + (width - right)
      + '" y2="' + zeroY + '"></line>';
    values.forEach(function (item, index) {
      const centerX = left + stepX * (index + 0.5);
      if (Number.isFinite(item.value)) {
        const valueY = top + ((maximum - item.value) / (maximum - minimum)) * plotHeight;
        const barY = Math.min(zeroY, valueY);
        const barHeight = Math.max(1, Math.abs(zeroY - valueY));
        svg += '<rect class="chart-bar" x="' + (centerX - barWidth / 2) + '" y="' + barY + '" width="'
          + barWidth + '" height="' + barHeight + '" rx="4" fill="' + metric.color + '"><title>'
          + escapeHTML(item.label + ': ' + valueLabel(item.value)) + '</title></rect>';
      } else {
        svg += '<text class="chart-empty-label" x="' + centerX + '" y="' + (zeroY - 8)
          + '" text-anchor="middle">—</text>';
      }
      svg += '<text class="chart-category-label" x="' + centerX + '" y="' + (height - 17)
        + '" text-anchor="middle">' + escapeHTML(item.label) + '</text>';
    });
    return svg + '</svg>';
  }

  function renderDataTable(collection) {
    const columns = collection === 'siswa'
      ? [['nama', 'Nama'], ['kelas', 'Kelas'], ['status', 'Status']]
      : collection === 'mentor'
        ? [['nama', 'Nama'], ['keahlian', 'Keahlian'], ['status', 'Status']]
        : [['deskripsi', 'Transaksi'], ['jenis', 'Jenis'], ['tanggal', 'Tanggal'], ['jumlah', 'Jumlah']];
    const tbody = document.querySelector('#data-table tbody');
    if (!tbody) return;
    const query = (document.getElementById('table-search').value || '').trim().toLocaleLowerCase('id');
    const rows = data[collection].filter(function (item) {
      return columns.some(function (column) {
        const value = column[0] === 'jumlah' ? formatCurrency(item.jumlah) : item[column[0]];
        return String(value).toLocaleLowerCase('id').includes(query);
      });
    });
    tbody.innerHTML = rows.length ? rows.map(function (item) {
      return '<tr>' + columns.map(function (column) {
        const value = column[0] === 'jumlah' ? formatCurrency(item.jumlah) : item[column[0]];
        const content = column[0] === 'status'
          ? '<span class="status-pill ' + (item.status === 'Aktif' ? 'status-active' : 'status-pending') + '">' + escapeHTML(value) + '</span>'
          : escapeHTML(value);
        return '<td>' + content + '</td>';
      }).join('') + '<td class="table-actions"><button class="text-button" type="button" data-action="edit" data-id="'
        + escapeHTML(item.id) + '">Ubah</button><button class="text-button text-danger" type="button" data-action="delete" data-id="'
        + escapeHTML(item.id) + '">Hapus</button></td></tr>';
    }).join('') : '<tr><td class="table-empty" colspan="' + (columns.length + 1) + '">Tidak ada data yang cocok.</td></tr>';
    document.getElementById('result-count').textContent = rows.length + ' data';
  }

  function renderCollection(collection) {
    const isFinance = collection === 'keuangan';
    if (isFinance) {
      const income = data.keuangan.filter(function (item) { return item.jenis === 'Pemasukan'; })
        .reduce(function (sum, item) { return sum + Number(item.jumlah); }, 0);
      const expense = data.keuangan.filter(function (item) { return item.jenis === 'Pengeluaran'; })
        .reduce(function (sum, item) { return sum + Number(item.jumlah); }, 0);
      document.getElementById('finance-income').textContent = formatCurrency(income);
      document.getElementById('finance-expense').textContent = formatCurrency(expense);
      document.getElementById('finance-balance').textContent = formatCurrency(income - expense);
    }
    renderDataTable(collection);
  }

  function renderView() {
    if (currentView === 'dashboard') {
      renderDashboard();
    } else {
      renderCollection(currentView);
    }
  }

  function openForm(collection, item) {
    editing = { collection: collection, id: item ? item.id : null };
    const fields = collection === 'siswa'
      ? [
        ['nama', 'Nama siswa', 'text', item && item.nama],
        ['kelas', 'Kelas', 'text', item && item.kelas],
        ['status', 'Status', 'select', item && item.status]
      ]
      : collection === 'mentor'
        ? [
          ['nama', 'Nama mentor', 'text', item && item.nama],
          ['keahlian', 'Keahlian', 'text', item && item.keahlian],
          ['status', 'Status', 'select', item && item.status]
        ]
        : [
          ['deskripsi', 'Keterangan transaksi', 'text', item && item.deskripsi],
          ['jenis', 'Jenis transaksi', 'transaction', item && item.jenis],
          ['jumlah', 'Jumlah (rupiah)', 'number', item && item.jumlah],
          ['tanggal', 'Tanggal', 'date', item && item.tanggal]
        ];
    document.getElementById('dialog-title').textContent = (item ? 'Ubah ' : 'Tambah ')
      + (collection === 'siswa' ? 'siswa' : collection === 'mentor' ? 'mentor' : 'transaksi');
    dialogFields.innerHTML = fields.map(function (field) {
      const value = field[3] == null ? '' : String(field[3]);
      if (field[2] === 'select' || field[2] === 'transaction') {
        const options = field[2] === 'select' ? ['Aktif', 'Menunggu'] : ['Pemasukan', 'Pengeluaran'];
        return '<label class="dialog-label" for="field-' + field[0] + '">' + field[1] + '</label><select required id="field-'
          + field[0] + '" name="' + field[0] + '">' + options.map(function (option) {
            return '<option' + (value === option ? ' selected' : '') + '>' + option + '</option>';
          }).join('') + '</select>';
      }
      return '<label class="dialog-label" for="field-' + field[0] + '">' + field[1] + '</label><input required id="field-'
        + field[0] + '" name="' + field[0] + '" type="' + field[2] + '" value="' + escapeHTML(value) + '"'
        + (field[2] === 'number' ? ' min="1" step="1"' : '') + (field[2] === 'date' ? ' max="9999-12-31"' : '') + '>';
    }).join('');
    if (collection === 'keuangan' && !item) {
      document.getElementById('field-tanggal').value = new Date().toISOString().slice(0, 10);
    }
    dataDialog.showModal();
  }

  function downloadReport() {
    const rows = [['Transaksi', 'Jenis', 'Jumlah (IDR)', 'Tanggal']].concat(data.keuangan.map(function (item) {
      return [item.deskripsi, item.jenis, item.jumlah, item.tanggal];
    }));
    const csv = rows.map(function (row) {
      return row.map(function (value) {
        return '"' + String(value).replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'laporan-keuangan-jarimath.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  viewContainer.addEventListener('input', function (event) {
    if (event.target.id === 'table-search') renderDataTable(currentView);
  });

  viewContainer.addEventListener('change', function (event) {
    if (event.target.id === 'dashboard-chart-metric') renderDashboardChart();
  });

  viewContainer.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'add') {
      openForm(currentView);
      return;
    }
    if (action === 'export') {
      downloadReport();
      return;
    }
    const item = data[currentView].find(function (record) { return record.id === button.dataset.id; });
    if (!item) return;
    if (action === 'edit') {
      openForm(currentView, item);
    } else if (action === 'delete' && window.confirm('Hapus data "' + (item.nama || item.deskripsi) + '"?')) {
      data[currentView] = data[currentView].filter(function (record) { return record.id !== item.id; });
      saveData(currentView);
      renderView();
    }
  });

  document.querySelectorAll('[data-close-dialog]').forEach(function (button) {
    button.addEventListener('click', function () { dataDialog.close(); });
  });

  dataForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!editing) return;
    const collection = editing.collection;
    const values = Object.fromEntries(new FormData(dataForm).entries());
    if (collection === 'keuangan') values.jumlah = Number(values.jumlah);
    if (editing.id) {
      data[collection] = data[collection].map(function (item) {
        return item.id === editing.id ? Object.assign({}, item, values) : item;
      });
    } else {
      values.id = 'data-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      data[collection].unshift(values);
    }
    saveData(collection);
    dataDialog.close();
    editing = null;
    renderView();
  });

  dataDialog.addEventListener('click', function (event) {
    if (event.target === dataDialog) dataDialog.close();
  });

  let authClient = null;

  function returnToLogin(message) {
    try {
      sessionStorage.removeItem(demoModeKey);
      if (message) sessionStorage.setItem(loginMessageKey, message);
    } catch (error) {
      dashboardMessage.textContent = 'Tidak dapat menyimpan status sesi browser: ' + error.message;
    }
    window.location.replace('../index.html');
  }

  async function initializeAuth() {
    let demoMode;
    try {
      demoMode = sessionStorage.getItem(demoModeKey) === 'true';
    } catch (error) {
      dashboardMessage.textContent = 'Tidak dapat membaca status sesi browser: ' + error.message;
      return;
    }

    if (demoMode) {
      showDashboard({ email: 'demo@jarimath.local' }, true);
      return;
    }

    try {
      authClient = window.createJarimathSupabaseClient();
      const { data: sessionData, error } = await authClient.auth.getSession();
      if (error) {
        returnToLogin('Tidak dapat memeriksa sesi Supabase: ' + error.message);
        return;
      }
      if (!sessionData.session) {
        returnToLogin('Sesi login tidak ditemukan. Silakan masuk kembali.');
        return;
      }
      showDashboard(sessionData.session.user, false);
    } catch (error) {
      returnToLogin(error.message || 'Tidak dapat memulai koneksi Supabase.');
    }
  }

  logoutButton.addEventListener('click', async function () {
    let demoMode;
    try {
      demoMode = sessionStorage.getItem(demoModeKey) === 'true';
    } catch (error) {
      dashboardMessage.textContent = 'Tidak dapat membaca status sesi browser: ' + error.message;
      return;
    }
    if (demoMode) {
      returnToLogin('');
      return;
    }
    if (!authClient) {
      dashboardMessage.textContent = 'Sesi autentikasi belum siap. Muat ulang halaman lalu coba lagi.';
      return;
    }

    logoutButton.disabled = true;
    dashboardMessage.textContent = '';
    try {
      const { error } = await authClient.auth.signOut();
      if (error) {
        dashboardMessage.textContent = 'Tidak dapat keluar: ' + error.message;
      } else {
        returnToLogin('');
      }
    } catch (error) {
      dashboardMessage.textContent = 'Tidak dapat keluar: ' + (error.message || 'Periksa koneksi internet.');
    } finally {
      logoutButton.disabled = false;
    }
  });

  initializeAuth();
})();
