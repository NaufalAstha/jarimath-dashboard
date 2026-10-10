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
    window.location.replace('index.html');
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
