(function () {
  const logoutButton = document.getElementById('logout-button');
  const dashboardMessage = document.getElementById('dashboard-message');
  const accountEmail = document.getElementById('account-email');
  const viewContainer = document.getElementById('view-container');
  const dataDialog = document.getElementById('data-dialog');
  const dataForm = document.getElementById('data-form');
  const dialogFields = document.getElementById('dialog-fields');
  const formMessage = document.getElementById('form-message');
  const demoModeKey = 'jarimath-demo-mode';
  const loginMessageKey = 'jarimath-login-message';
  const storageKeys = {
    siswa: 'jarimath-demo-siswa',
    mentor: 'jarimath-demo-mentor',
    keuangan: 'jarimath-demo-keuangan',
    program: 'jarimath-demo-program',
    biaya_tetap: 'jarimath-demo-biaya-tetap',
    penugasan_mentor: 'jarimath-demo-penugasan-mentor',
    pembayaran_mentor: 'jarimath-demo-pembayaran-mentor',
    pengaturan: 'jarimath-demo-pengaturan'
  };
  const initialData = {
    siswa: [
      { id: 's-1', nama: 'Alya Putri', asal_sekolah: 'SD Nusantara', usia: 8, telepon_orang_tua: '081234567890', nama_orang_tua: 'Budi Putra', program_id: 'p-1', program: 'Matematika dasar', spp: 350000, status: 'Aktif' },
      { id: 's-2', nama: 'Rafi Pratama', asal_sekolah: 'SD Merdeka', usia: 7, telepon_orang_tua: '081298765432', nama_orang_tua: 'Siti Pratama', program_id: 'p-2', program: 'Berhitung ceria', spp: 350000, status: 'Aktif' },
      { id: 's-3', nama: 'Nadia Zahra', asal_sekolah: 'SD Harapan', usia: 9, telepon_orang_tua: '081234567891', nama_orang_tua: 'Dewi Zahra', program_id: 'p-1', program: 'Matematika dasar', spp: 350000, status: 'Menunggu' }
    ],
    mentor: [
      { id: 'm-1', nama: 'Kak Dinda', telepon: '081234567892', kapasitas_murid: 4, tarif_per_anak: 0, tanggal_bayar: null },
      { id: 'm-2', nama: 'Kak Fajar', telepon: '081234567893', kapasitas_murid: 4, tarif_per_anak: 0, tanggal_bayar: null }
    ],
    keuangan: [
      { id: 'k-1', deskripsi: 'Pembayaran kelas Alya', jenis: 'Pemasukan', jumlah: 350000, tanggal: '2026-10-02' },
      { id: 'k-2', deskripsi: 'Perlengkapan belajar', jenis: 'Pengeluaran', jumlah: 75000, tanggal: '2026-10-05' },
      { id: 'k-3', deskripsi: 'Pembayaran kelas Rafi', jenis: 'Pemasukan', jumlah: 350000, tanggal: '2026-10-08' }
    ],
    program: [
      { id: 'p-1', nama: 'Matematika dasar', spp: 350000 },
      { id: 'p-2', nama: 'Berhitung ceria', spp: 350000 }
    ],
    biaya_tetap: [],
    penugasan_mentor: [],
    pembayaran_mentor: [],
    pengaturan: [{ id: 'global', tanggal_bayar: 5 }]
  };
  let storageWarning = false;
  let data = loadData();
  let currentView = document.body.dataset.page;
  let editing = null;
  let isDemoMode = false;

  data.mentor.forEach(function (mentor) {
    if (!Number.isInteger(Number(mentor.kapasitas_murid)) || Number(mentor.kapasitas_murid) < 1) {
      mentor.kapasitas_murid = 4;
    }
    if (!Number.isFinite(Number(mentor.tarif_per_anak))) mentor.tarif_per_anak = 0;
    if (mentor.tanggal_bayar === '') mentor.tanggal_bayar = null;
  });
  if (!data.pengaturan.length) data.pengaturan.push({ id: 'global', tanggal_bayar: 5 });
  if (!Number.isInteger(Number(data.pengaturan[0].tanggal_bayar))) data.pengaturan[0].tanggal_bayar = 5;

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

  async function loadRemoteData() {
    const collections = Object.keys(storageKeys);
    const loaded = await Promise.all(collections.map(async function (collection) {
      const result = await authClient.from(collection)
        .select('*')
        .order('created_at', { ascending: false });
      if (result.error) {
        throw new Error('Tabel ' + collection + ': ' + result.error.message);
      }
      if (!Array.isArray(result.data)) {
        throw new Error('Supabase mengembalikan format data yang tidak valid untuk tabel ' + collection + '.');
      }
      return result.data;
    }));
    collections.forEach(function (collection, index) {
      data[collection] = loaded[index];
    });
    if (!data.pengaturan.length) data.pengaturan.push({ id: 'global', tanggal_bayar: 5 });
    data.mentor.forEach(function (mentor) {
      if (!Number.isInteger(Number(mentor.kapasitas_murid)) || Number(mentor.kapasitas_murid) < 1) {
        mentor.kapasitas_murid = 4;
      }
      if (!Number.isFinite(Number(mentor.tarif_per_anak))) mentor.tarif_per_anak = 0;
      if (mentor.tanggal_bayar === '') mentor.tanggal_bayar = null;
    });
  }

  async function saveRemoteRecord(collection, id, values) {
    const request = id
      ? authClient.from(collection).update(values).eq('id', id)
      : authClient.from(collection).insert(values);
    const result = await request.select('*').single();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }

  async function deleteRemoteRecord(collection, id) {
    const result = await authClient.from(collection).delete().eq('id', id).select('id');
    if (result.error) throw new Error(result.error.message);
    if (!result.data || result.data.length !== 1) {
      throw new Error('Data tidak ditemukan atau admin tidak memiliki izin untuk menghapusnya.');
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
    isDemoMode = isDemo;
    accountEmail.textContent = isDemo ? 'Mode demo · data lokal' : (user.email || '');
    dashboardMessage.textContent = storageWarning
      ? 'Data demo tidak dapat dibaca. Data contoh sementara digunakan.'
      : '';
    renderView();
  }

  function renderDashboard() {
    const financeRecords = getFinanceRecords();
    const income = financeRecords.filter(function (item) { return item.jenis === 'Pemasukan'; })
      .reduce(function (sum, item) { return sum + Number(item.jumlah); }, 0);
    const expense = financeRecords.filter(function (item) { return item.jenis === 'Pengeluaran'; })
      .reduce(function (sum, item) { return sum + Number(item.jumlah); }, 0);
    document.getElementById('student-count').textContent = data.siswa.length;
    document.getElementById('mentor-count').textContent = data.mentor.length;
    document.getElementById('recorded-balance').textContent = formatCurrency(income - expense);
    document.getElementById('activity-table-body').innerHTML = financeRecords.slice()
      .sort(function (left, right) {
        return String(right.tanggal).localeCompare(String(left.tanggal));
      }).slice(0, 5)
      .map(function (item) {
        return '<tr><td>' + escapeHTML(item.deskripsi) + '</td><td>' + escapeHTML(item.tanggal) + '</td><td>'
          + escapeHTML(item.jenis) + '</td><td>' + escapeHTML(formatCurrency(item.jumlah)) + '</td></tr>';
      }).join('');
    renderDailyAssignments();
    renderDashboardChart();
  }

  function renderDailyAssignments() {
    const dateInput = document.getElementById('assignment-date');
    const mentorSelect = document.getElementById('assignment-mentor');
    const studentSelect = document.getElementById('assignment-student');
    const tbody = document.querySelector('#assignment-table tbody');
    if (!dateInput || !mentorSelect || !studentSelect || !tbody) return;
    if (!dateInput.value) dateInput.value = formatDateKey(new Date());
    const date = dateInput.value;
    dateInput.min = formatDateKey(new Date());
    const assigned = data.penugasan_mentor.filter(function (assignment) { return assignment.tanggal === date; });
    const activeMentors = data.mentor.filter(function (mentor) {
      const assignedCount = assigned.filter(function (assignment) { return assignment.mentor_id === mentor.id; }).length;
      return assignedCount < Number(mentor.kapasitas_murid || 0);
    });
    const previousMentorId = mentorSelect.value;
    mentorSelect.innerHTML = activeMentors.map(function (mentor) {
      const count = assigned.filter(function (assignment) { return assignment.mentor_id === mentor.id; }).length;
      return '<option value="' + escapeHTML(mentor.id) + '"' + (mentor.id === previousMentorId ? ' selected' : '') + '>'
        + escapeHTML(mentor.nama) + ' (' + count + '/' + Number(mentor.kapasitas_murid) + ')</option>';
    }).join('');
    const assignedStudentIds = assigned.map(function (assignment) { return assignment.siswa_id; });
    const availableStudents = data.siswa.filter(function (student) {
      return student.status === 'Aktif' && assignedStudentIds.indexOf(student.id) === -1;
    });
    studentSelect.innerHTML = availableStudents.map(function (student) {
      return '<option value="' + escapeHTML(student.id) + '">' + escapeHTML(student.nama) + '</option>';
    }).join('');
    const button = document.getElementById('assign-student-button');
    if (button) button.disabled = !activeMentors.length || !availableStudents.length;
    const rows = assigned.map(function (assignment) {
      const mentor = data.mentor.find(function (item) { return item.id === assignment.mentor_id; });
      const student = data.siswa.find(function (item) { return item.id === assignment.siswa_id; });
      return '<tr><td>' + escapeHTML(student ? student.nama : 'Siswa dihapus') + '</td><td>'
        + escapeHTML(mentor ? mentor.nama : 'Mentor dihapus') + '</td><td class="table-actions"><button class="text-button text-danger"'
        + ' type="button" data-action="remove-assignment" data-id="' + escapeHTML(assignment.id) + '">Hapus</button></td></tr>';
    });
    tbody.innerHTML = rows.length ? rows.join('')
      : '<tr><td class="table-empty" colspan="3">Belum ada penugasan untuk tanggal ini.</td></tr>';
  }

  function getMonthlyMentorEarnings(mentorId, monthKey) {
    const students = new Set(data.penugasan_mentor.filter(function (assignment) {
      return assignment.mentor_id === mentorId && String(assignment.tanggal).slice(0, 7) === monthKey
        && assignment.tanggal <= formatDateKey(new Date());
    }).map(function (assignment) { return assignment.siswa_id; }));
    const mentor = data.mentor.find(function (item) { return item.id === mentorId; });
    return students.size * Number(mentor ? mentor.tarif_per_anak : 0);
  }

  function getMonthlyStudentCount(mentorId, monthKey) {
    return new Set(data.penugasan_mentor.filter(function (assignment) {
      return assignment.mentor_id === mentorId && String(assignment.tanggal).slice(0, 7) === monthKey
        && assignment.tanggal <= formatDateKey(new Date());
    }).map(function (assignment) { return assignment.siswa_id; })).size;
  }

  async function generateDueMentorPayments() {
    const todayKey = formatDateKey(new Date());
    const globalPaymentDay = Number(data.pengaturan[0].tanggal_bayar) || 5;
    const periods = {};
    data.penugasan_mentor.forEach(function (assignment) {
      if (!assignment.tanggal || assignment.tanggal > todayKey) return;
      const monthKey = String(assignment.tanggal).slice(0, 7);
      if (!periods[assignment.mentor_id]) periods[assignment.mentor_id] = {};
      periods[assignment.mentor_id][monthKey] = true;
    });
    for (const mentor of data.mentor) {
      const months = Object.keys(periods[mentor.id] || {});
      for (const monthKey of months) {
        const monthStart = new Date(monthKey + '-01T00:00:00');
        const payoutMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
        const paymentDay = Number(mentor.tanggal_bayar) || globalPaymentDay;
        const paymentDate = new Date(payoutMonth.getFullYear(), payoutMonth.getMonth(),
          Math.min(paymentDay, new Date(payoutMonth.getFullYear(), payoutMonth.getMonth() + 1, 0).getDate()));
        const paymentDateKey = formatDateKey(paymentDate);
        if (paymentDateKey > todayKey || data.pembayaran_mentor.some(function (payment) {
          return payment.mentor_id === mentor.id && payment.periode === monthKey + '-01';
        })) continue;
        const studentCount = getMonthlyStudentCount(mentor.id, monthKey);
        const amount = studentCount * Number(mentor.tarif_per_anak || 0);
        if (!studentCount || !amount) continue;
        const values = {
          mentor_id: mentor.id,
          nama_mentor: mentor.nama,
          periode: monthKey + '-01',
          jumlah_siswa: studentCount,
          tarif_per_anak: Number(mentor.tarif_per_anak),
          jumlah: amount,
          tanggal_bayar: paymentDateKey
        };
        if (isDemoMode) {
          values.id = 'mentor-pay-' + mentor.id + '-' + monthKey;
          values.created_at = paymentDateKey + 'T12:00:00';
          data.pembayaran_mentor.push(values);
          saveData('pembayaran_mentor');
        } else {
          const result = await authClient.from('pembayaran_mentor')
            .upsert(values, { onConflict: 'mentor_id,periode', ignoreDuplicates: true })
            .select('*');
          if (result.error) throw new Error('Tidak dapat mencatat pembayaran mentor: ' + result.error.message);
          if (result.data && result.data.length) data.pembayaran_mentor.push(result.data[0]);
        }
      }
    }
  }

  function renderDashboardChart() {
    const selector = document.getElementById('dashboard-chart-metric');
    const durationSelector = document.getElementById('dashboard-chart-duration');
    const chart = document.getElementById('dashboard-chart');
    const description = document.getElementById('dashboard-chart-description');
    const note = document.getElementById('dashboard-chart-note');
    if (!selector || !durationSelector || !chart || !description || !note) return;

    const metric = selector.value;
    const duration = durationSelector.value;
    const hasData = metric === 'murid' ? data.siswa.length > 0 : getFinanceRecords().length > 0;
    if (!hasData) {
      chart.innerHTML = '<p class="chart-no-data">No Data</p>';
      description.textContent = 'Belum ada data untuk ditampilkan.';
      note.textContent = '';
      return;
    }
    description.textContent = metric === 'murid'
      ? duration === 'today' ? 'Jumlah murid baru per jam hari ini.' : 'Jumlah murid baru berdasarkan tanggal pendaftaran.'
      : description.textContent;
    const buckets = createChartBuckets(duration);
    const financialInterval = duration === 'today' ? 'jam' : duration === 'year' ? 'bulan' : 'hari';
    const currencyFormatter = new Intl.NumberFormat('id-ID', {
      notation: 'compact', maximumFractionDigits: 1
    });
    const metrics = {
      murid: {
        description: duration === 'today'
          ? 'Jumlah murid baru per jam hari ini.'
          : 'Jumlah murid baru berdasarkan tanggal pendaftaran.',
        note: 'Tanggal dan jam pendaftaran menggunakan waktu data murid dibuat.',
        color: '#526779',
        values: buckets.map(function (bucket) {
          return {
            label: bucket.label,
            title: bucket.title,
            value: data.siswa.filter(function (student) {
              const createdAt = student.created_at ? new Date(student.created_at) : new Date();
              return !Number.isNaN(createdAt.getTime())
                && getChartBucketKey(createdAt, duration) === bucket.key;
            }).length
          };
        })
      },
      revenue: {
        description: 'Revenue pemasukan per ' + financialInterval + ' dalam periode yang dipilih.',
        note: duration === 'today'
          ? 'Transaksi bertanggal hari ini dikelompokkan berdasarkan jam pencatatan.'
          : 'Transaksi dikelompokkan berdasarkan tanggal transaksi.',
        color: '#547b68',
        values: [],
        kind: 'currency'
      },
      margin: {
        description: 'Margin profit per ' + financialInterval + ' dalam periode yang dipilih.',
        note: duration === 'today'
          ? 'Margin profit per jam; periode tanpa revenue ditampilkan sebagai —.'
          : 'Margin profit = (revenue - cost) / revenue. Periode tanpa revenue ditampilkan sebagai —.',
        color: '#7c6a9a',
        values: [],
        kind: 'percent'
      },
      cost: {
        description: 'Cost pengeluaran per ' + financialInterval + ' dalam periode yang dipilih.',
        note: duration === 'today'
          ? 'Transaksi bertanggal hari ini dikelompokkan berdasarkan jam pencatatan.'
          : 'Transaksi dikelompokkan berdasarkan tanggal transaksi.',
        color: '#a06c58',
        values: [],
        kind: 'currency'
      }
    };
    const selectedMetric = metrics[metric] || metrics.murid;
    description.textContent = selectedMetric.description;
    note.textContent = selectedMetric.note;

    if (metric !== 'murid') {
      const totalsByDate = {};
      getFinanceRecords().forEach(function (transaction) {
        let key;
        if (duration === 'today') {
          if (String(transaction.tanggal || '').slice(0, 10) !== buckets[0].dateKey) return;
          const createdAt = transaction.created_at
            ? new Date(transaction.created_at)
            : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12);
          if (Number.isNaN(createdAt.getTime())) return;
          key = getChartBucketKey(createdAt, duration);
        } else {
          key = duration === 'year'
            ? String(transaction.tanggal || '').slice(0, 7)
            : String(transaction.tanggal || '').slice(0, 10);
        }
        const validKey = duration === 'today'
          ? /^\d{2}$/.test(key)
          : duration === 'year' ? /^\d{4}-\d{2}$/.test(key) : /^\d{4}-\d{2}-\d{2}$/.test(key);
        if (!validKey) return;
        if (!totalsByDate[key]) totalsByDate[key] = { revenue: 0, cost: 0 };
        if (transaction.jenis === 'Pemasukan') {
          totalsByDate[key].revenue += Number(transaction.jumlah) || 0;
        } else if (transaction.jenis === 'Pengeluaran') {
          totalsByDate[key].cost += Number(transaction.jumlah) || 0;
        }
      });
      selectedMetric.values = buckets.map(function (bucket) {
        const totals = totalsByDate[bucket.key] || { revenue: 0, cost: 0 };
        let value;
        if (metric === 'revenue') value = totals.revenue;
        else if (metric === 'cost') value = totals.cost;
        else value = totals.revenue ? (totals.revenue - totals.cost) / totals.revenue * 100 : null;
        return { label: bucket.label, title: bucket.title, value: value };
      });
    }

    chart.innerHTML = renderLineChart(selectedMetric.values, selectedMetric, currencyFormatter);
  }

  function getFinanceRecords() {
    const today = new Date();
    const todayKey = formatDateKey(today);
    const recurringExpenses = [];
    data.biaya_tetap.forEach(function (fixedCost) {
      if (fixedCost.aktif === false || !fixedCost.tanggal_mulai) return;
      const start = new Date(fixedCost.tanggal_mulai + 'T00:00:00');
      if (Number.isNaN(start.getTime())) return;
      for (let year = start.getFullYear(), month = start.getMonth();
        year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth());
        month += 1) {
        if (month > 11) {
          year += 1;
          month = 0;
        }
        const day = Math.min(start.getDate(), new Date(year, month + 1, 0).getDate());
        const date = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        if (date >= fixedCost.tanggal_mulai && date <= todayKey) {
          recurringExpenses.push({
            id: fixedCost.id + '-' + date,
            deskripsi: fixedCost.nama,
            jenis: 'Pengeluaran',
            jumlah: Number(fixedCost.jumlah),
            tanggal: date,
            created_at: date + 'T12:00:00',
            biaya_tetap_id: fixedCost.id
          });
        }
      }
    });
    const mentorPayments = data.pembayaran_mentor.map(function (payment) {
      return {
        id: 'mentor-pay-' + payment.id,
        deskripsi: 'Pendapatan mentor ' + payment.nama_mentor + ' (' + payment.jumlah_siswa + ' siswa, '
          + payment.periode.slice(0, 7) + ')',
        jenis: 'Pengeluaran',
        jumlah: Number(payment.jumlah),
        tanggal: payment.tanggal_bayar,
        created_at: payment.tanggal_bayar + 'T12:00:00',
        pembayaran_mentor_id: payment.id
      };
    });
    return data.keuangan.concat(recurringExpenses, mentorPayments);
  }

  function formatDateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-'
      + String(date.getDate()).padStart(2, '0');
  }

  function getChartBucketKey(date, duration) {
    if (duration === 'today') return String(date.getHours()).padStart(2, '0');
    const dateKey = formatDateKey(date);
    return duration === 'year' ? dateKey.slice(0, 7) : dateKey;
  }

  function createChartBuckets(duration) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekdayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
    const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short' });
    const fullDateFormatter = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    const buckets = [];
    if (duration === 'today') {
      for (let hour = 0; hour < 24; hour += 1) {
        const key = String(hour).padStart(2, '0');
        buckets.push({
          key: key,
          label: hour % 4 === 0 ? key : '',
          title: key + ':00',
          dateKey: formatDateKey(start)
        });
      }
      return buckets;
    }
    if (duration === 'week') {
      const monday = new Date(start);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      for (let offset = 0; offset < 7; offset += 1) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + offset);
        buckets.push({
          key: formatDateKey(date),
          label: weekdayFormatter.format(date),
          title: fullDateFormatter.format(date)
        });
      }
      return buckets;
    }
    if (duration === 'year') {
      for (let month = 0; month < 12; month += 1) {
        const date = new Date(start.getFullYear(), month, 1);
        buckets.push({
          key: date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'),
          label: monthFormatter.format(date),
          title: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date)
        });
      }
      return buckets;
    }
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), day);
      buckets.push({
        key: formatDateKey(date),
        label: day === 1 || day % 5 === 0 ? String(day) : '',
        title: fullDateFormatter.format(date)
      });
    }
    return buckets;
  }

  function renderLineChart(values, metric, currencyFormatter) {
    const chartElement = document.getElementById('dashboard-chart');
    const width = Math.max(320, chartElement ? chartElement.clientWidth - 36 : 760);
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
    const stepX = values.length > 1 ? plotWidth / (values.length - 1) : 0;
    const pointX = function (index) {
      return values.length > 1 ? left + stepX * index : left + plotWidth / 2;
    };
    const pointY = function (value) {
      return top + ((maximum - value) / (maximum - minimum)) * plotHeight;
    };
    const axisLabel = function (value) {
      if (metric.kind === 'currency') {
        return 'Rp' + currencyFormatter.format(value);
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
    let segment = [];
    function appendSegment() {
      if (segment.length > 1) {
        svg += '<polyline class="chart-line" points="' + segment.map(function (point) {
          return point.x + ',' + point.y;
        }).join(' ') + '" stroke="' + metric.color + '"></polyline>';
      }
      segment = [];
    }
    values.forEach(function (item, index) {
      const x = pointX(index);
      if (Number.isFinite(item.value)) {
        const y = pointY(item.value);
        segment.push({ x: x, y: y });
      }
    });
    appendSegment();
    values.forEach(function (item, index) {
      const x = pointX(index);
      if (Number.isFinite(item.value)) {
        const y = pointY(item.value);
        const pointLabel = item.title || item.label || 'Titik ' + (index + 1);
        svg += '<circle class="chart-point" cx="' + x + '" cy="' + y + '" r="4" fill="' + metric.color
          + '"><title>' + escapeHTML(pointLabel + ': ' + valueLabel(item.value)) + '</title></circle>';
      } else {
        svg += '<text class="chart-empty-label" x="' + x + '" y="' + (top + plotHeight / 2)
          + '" text-anchor="middle">—</text>';
      }
      svg += '<text class="chart-category-label" x="' + x + '" y="' + (height - 17)
        + '" text-anchor="middle">' + escapeHTML(item.label) + '</text>';
    });
    return svg + '</svg>';
  }

  function renderDataTable(collection) {
    const columns = collection === 'siswa'
      ? [['nama', 'Nama'], ['usia', 'Usia'], ['asal_sekolah', 'Asal sekolah'],
        ['nama_orang_tua', 'Nama orang tua'], ['telepon_orang_tua', 'Telepon orang tua'],
        ['program', 'Program'], ['spp', 'SPP/bulan'], ['status', 'Status']]
      : collection === 'mentor'
        ? [['nama', 'Nama'], ['telepon', 'Nomor telepon'],
          ['pendapatan', 'Pendapatan bulan ini']]
        : collection === 'program'
          ? [['nama', 'Program'], ['spp', 'SPP per bulan']]
          : collection === 'biaya_tetap'
            ? [['nama', 'Biaya tetap'], ['jumlah', 'Jumlah/bulan'], ['tanggal_mulai', 'Mulai sejak']]
            : [['deskripsi', 'Transaksi'], ['jenis', 'Jenis'], ['tanggal', 'Tanggal'], ['jumlah', 'Jumlah']];
    const tableId = collection === 'program' ? 'program-table' : collection === 'biaya_tetap' ? 'fixed-cost-table' : 'data-table';
    const tbody = document.querySelector('#' + tableId + ' tbody');
    if (!tbody) return;
    const search = document.getElementById('table-search');
    const query = (search ? search.value : '').trim().toLocaleLowerCase('id');
    function getColumnValue(item, columnName) {
      let value = item[columnName];
      if (collection === 'mentor' && columnName === 'pendapatan') {
        value = getMonthlyMentorEarnings(item.id, formatDateKey(new Date()).slice(0, 7));
        return formatCurrency(value);
      }
      if (collection === 'siswa' && columnName === 'spp') {
        const program = data.program.find(function (entry) {
          return entry.id === item.program_id || entry.nama === item.program;
        });
        if (program) value = program.spp;
      }
      if ((columnName === 'jumlah' || columnName === 'spp') && value != null) {
        return formatCurrency(value);
      }
      return value == null ? '' : value;
    }
    const collectionRows = collection === 'keuangan' ? getFinanceRecords() : data[collection];
    const rows = collectionRows.filter(function (item) {
      return columns.some(function (column) {
        const value = getColumnValue(item, column[0]);
        return String(value).toLocaleLowerCase('id').includes(query);
      });
    });
    tbody.innerHTML = rows.length ? rows.map(function (item) {
      return '<tr>' + columns.map(function (column) {
        const value = getColumnValue(item, column[0]);
        const content = column[0] === 'status'
          ? '<span class="status-pill ' + (item.status === 'Aktif' ? 'status-active' : 'status-pending') + '">' + escapeHTML(value) + '</span>'
          : escapeHTML(value);
        return '<td>' + content + '</td>';
      }).join('') + (item.biaya_tetap_id || item.pembayaran_mentor_id
        ? '<td class="table-actions">' + (item.pembayaran_mentor_id ? 'Otomatis' : 'Biaya tetap') + '</td>'
        : '<td class="table-actions">' + (collection === 'mentor'
          ? '<button class="text-button" type="button" data-action="configure-mentor" data-id="' + escapeHTML(item.id)
            + '">Pengaturan</button>'
          : '') + '<button class="text-button" type="button" data-action="edit" data-collection="'
          + collection + '" data-id="' + escapeHTML(item.id) + '">Ubah</button><button class="text-button text-danger" type="button" data-action="delete" data-id="'
          + escapeHTML(item.id) + '" data-collection="' + collection + '">Hapus</button></td>') + '</tr>';
    }).join('') : '<tr><td class="table-empty" colspan="' + (columns.length + 1) + '">Tidak ada data yang cocok.</td></tr>';
    const resultCount = document.getElementById(collection === 'program' ? 'program-result-count'
      : collection === 'biaya_tetap' ? 'fixed-cost-result-count' : 'result-count');
    if (resultCount) resultCount.textContent = rows.length + ' data';
  }

  function renderCollection(collection) {
    if (collection === 'mentor') {
      const input = document.getElementById('global-payment-day');
      if (input) input.value = data.pengaturan[0].tanggal_bayar;
    }
    const isFinance = collection === 'keuangan';
    if (isFinance) {
      const financeRecords = getFinanceRecords();
      const income = financeRecords.filter(function (item) { return item.jenis === 'Pemasukan'; })
        .reduce(function (sum, item) { return sum + Number(item.jumlah); }, 0);
      const expense = financeRecords.filter(function (item) { return item.jenis === 'Pengeluaran'; })
        .reduce(function (sum, item) { return sum + Number(item.jumlah); }, 0);
      document.getElementById('finance-income').textContent = formatCurrency(income);
      document.getElementById('finance-expense').textContent = formatCurrency(expense);
      document.getElementById('finance-balance').textContent = formatCurrency(income - expense);
    }
    renderDataTable(collection);
    if (collection === 'siswa') renderDataTable('program');
    if (collection === 'keuangan') renderDataTable('biaya_tetap');
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
    formMessage.textContent = '';
    const matchingProgram = item && data.program.find(function (program) {
      return program.id === item.program_id || program.nama === item.program;
    });
    const fields = collection === 'siswa'
      ? [
        ['nama', 'Nama siswa', 'text', item && item.nama],
        ['usia', 'Usia', 'number', item && item.usia],
        ['asal_sekolah', 'Asal sekolah', 'text', item && item.asal_sekolah],
        ['nama_orang_tua', 'Nama orang tua', 'text', item && item.nama_orang_tua],
        ['telepon_orang_tua', 'Nomor telepon orang tua', 'tel', item && item.telepon_orang_tua],
        ['program_id', 'Program yang diikuti', 'program', item && (item.program_id || (matchingProgram && matchingProgram.id))],
        ['status', 'Status', 'select', item && item.status]
      ]
      : collection === 'mentor'
        ? [
          ['nama', 'Nama mentor', 'text', item && item.nama],
          ['telepon', 'Nomor telepon', 'tel', item && item.telepon]
        ]
        : collection === 'mentor_settings'
          ? [
            ['kapasitas_murid', 'Maksimal murid yang diajar per hari', 'number', item && item.kapasitas_murid],
            ['tarif_per_anak', 'Tarif per anak per bulan (rupiah)', 'number', item && item.tarif_per_anak],
            ['tanggal_bayar', 'Tanggal bayar khusus (kosong = default global)', 'number', item && item.tanggal_bayar]
          ]
        : collection === 'program'
          ? [
            ['nama', 'Nama program', 'text', item && item.nama],
            ['spp', 'SPP per bulan (rupiah)', 'number', item && item.spp]
          ]
          : collection === 'biaya_tetap'
            ? [
              ['nama', 'Nama biaya tetap', 'text', item && item.nama],
              ['jumlah', 'Jumlah per bulan (rupiah)', 'number', item && item.jumlah],
              ['tanggal_mulai', 'Mulai dihitung sejak', 'date', item && item.tanggal_mulai]
            ]
            : [
          ['deskripsi', 'Keterangan transaksi', 'text', item && item.deskripsi],
          ['jenis', 'Jenis transaksi', 'transaction', item && item.jenis],
          ['jumlah', 'Jumlah (rupiah)', 'number', item && item.jumlah],
          ['tanggal', 'Tanggal', 'date', item && item.tanggal]
        ];
    document.getElementById('dialog-title').textContent = (item ? 'Ubah ' : 'Tambah ')
      + (collection === 'siswa' ? 'siswa' : collection === 'mentor' ? 'mentor'
        : collection === 'mentor_settings' ? 'pengaturan mentor'
        : collection === 'program' ? 'program' : collection === 'biaya_tetap' ? 'biaya tetap' : 'transaksi');
    dialogFields.innerHTML = fields.map(function (field) {
      const value = field[3] == null ? '' : String(field[3]);
      if (field[2] === 'select' || field[2] === 'transaction' || field[2] === 'program') {
        const options = field[2] === 'select' ? ['Aktif', 'Menunggu']
          : field[2] === 'transaction' ? ['Pemasukan', 'Pengeluaran']
            : data.program.map(function (program) { return program.id; });
        const optionLabels = field[2] === 'program'
          ? data.program.map(function (program) {
            return program.nama + ' — SPP ' + formatCurrency(program.spp);
          }) : options;
        return '<label class="dialog-label" for="field-' + field[0] + '">' + field[1] + '</label><select required id="field-'
          + field[0] + '" name="' + field[0] + '">' + options.map(function (option, index) {
            return '<option value="' + escapeHTML(option) + '"' + (value === option ? ' selected' : '') + '>'
              + escapeHTML(optionLabels[index]) + '</option>';
          }).join('') + '</select>';
      }
      const optional = field[0] === 'tanggal_bayar';
      const numericMin = field[0] === 'kapasitas_murid' || field[0] === 'tanggal_bayar' ? '1' : '0';
      const numericMax = field[0] === 'tanggal_bayar' ? '31' : '';
      return '<label class="dialog-label" for="field-' + field[0] + '">' + field[1] + '</label><input'
        + (optional ? '' : ' required') + ' id="field-'
        + field[0] + '" name="' + field[0] + '" type="' + field[2] + '" value="' + escapeHTML(value) + '"'
        + (field[2] === 'number' ? ' min="' + numericMin + '"' + (numericMax ? ' max="' + numericMax + '"' : '') + ' step="1"' : '')
        + (field[2] === 'date' ? ' max="9999-12-31"' : '')
        + (field[2] === 'tel' ? ' inputmode="tel" autocomplete="tel" maxlength="20" title="Masukkan nomor Indonesia yang valid, misalnya 081234567890 atau +6281234567890"' : '')
        + '>';
    }).join('');
    if (collection === 'siswa') {
      const programSelect = document.getElementById('field-program_id');
      if (programSelect) {
        programSelect.insertAdjacentHTML('afterend', '<p id="program-spp-preview" class="form-hint"></p>');
        updateProgramFeePreview();
      }
    }
    if (collection === 'siswa' && !item && data.program.length === 0) {
      formMessage.textContent = 'Tambahkan program terlebih dahulu sebelum mendaftarkan siswa.';
    }
    if (collection === 'siswa' && item && !matchingProgram) {
      const select = document.getElementById('field-program_id');
      if (select) select.insertAdjacentHTML('afterbegin', '<option value="' + escapeHTML(item.program_id || '') + '" selected>'
        + escapeHTML(item.program || 'Program lama') + ' — SPP ' + formatCurrency(item.spp) + '</option>');
    }
    if (collection === 'keuangan' && !item) {
      document.getElementById('field-tanggal').value = formatDateKey(new Date());
    }
    if (collection === 'biaya_tetap' && !item) {
      document.getElementById('field-tanggal_mulai').value = formatDateKey(new Date());
    }
    dataDialog.showModal();
  }

  function downloadReport() {
    const rows = [['Transaksi', 'Jenis', 'Jumlah (IDR)', 'Tanggal']].concat(getFinanceRecords().map(function (item) {
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
    if (event.target.id === 'table-search') {
      renderDataTable(currentView);
      if (currentView === 'siswa') renderDataTable('program');
      if (currentView === 'keuangan') renderDataTable('biaya_tetap');
    }
  });

  viewContainer.addEventListener('change', function (event) {
    if (event.target.id === 'dashboard-chart-metric'
      || event.target.id === 'dashboard-chart-duration') renderDashboardChart();
    if (event.target.id === 'assignment-date') renderDailyAssignments();
  });

  viewContainer.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const collection = button.dataset.collection || currentView;
    if (action === 'assign-student') {
      assignStudentForDate();
      return;
    }
    if (action === 'remove-assignment') {
      removeStudentAssignment(button.dataset.id);
      return;
    }
    if (action === 'add') {
      openForm(collection);
      return;
    }
    if (action === 'export') {
      downloadReport();
      return;
    }
    const item = data[collection].find(function (record) { return record.id === button.dataset.id; });
    if (!item) return;
    if (action === 'edit') {
      openForm(collection, item);
    } else if (action === 'configure-mentor') {
      openForm('mentor_settings', item);
    } else if (action === 'delete' && collection === 'program' && data.siswa.some(function (student) {
      return student.program_id === item.id || student.program === item.nama;
    })) {
      dashboardMessage.textContent = 'Program masih digunakan oleh siswa. Ubah program siswa terlebih dahulu.';
    } else if (action === 'delete' && window.confirm('Hapus data "' + (item.nama || item.deskripsi) + '"?')) {
      button.disabled = true;
      dashboardMessage.textContent = '';
      (async function () {
        try {
          if (isDemoMode) {
            data[collection] = data[collection].filter(function (record) { return record.id !== item.id; });
            saveData(collection);
          } else {
            await deleteRemoteRecord(collection, item.id);
            data[collection] = data[collection].filter(function (record) { return record.id !== item.id; });
          }
          renderView();
        } catch (error) {
          dashboardMessage.textContent = 'Tidak dapat menghapus data: ' + error.message;
          button.disabled = false;
        }
      })();
    }
  });

  async function assignStudentForDate() {
    const date = document.getElementById('assignment-date').value;
    const mentorId = document.getElementById('assignment-mentor').value;
    const studentId = document.getElementById('assignment-student').value;
    const message = document.getElementById('assignment-message');
    const mentor = data.mentor.find(function (item) { return item.id === mentorId; });
    const student = data.siswa.find(function (item) { return item.id === studentId; });
    if (!date || !mentor || !student) {
      message.textContent = 'Pilih tanggal, mentor, dan siswa sebelum membuat penugasan.';
      return;
    }
    const assignedToday = data.penugasan_mentor.filter(function (item) { return item.tanggal === date; });
    if (date < formatDateKey(new Date())) {
      message.textContent = 'Penugasan baru hanya dapat dibuat untuk hari ini atau tanggal mendatang.';
      return;
    }
    if (data.penugasan_mentor.some(function (item) { return item.tanggal === date && item.siswa_id === studentId; })) {
      message.textContent = 'Siswa sudah mendapat mentor pada tanggal tersebut.';
      return;
    }
    const mentorAssignmentCount = assignedToday.filter(function (item) { return item.mentor_id === mentorId; }).length;
    if (mentorAssignmentCount >= Number(mentor.kapasitas_murid)) {
      message.textContent = 'Mentor sudah mencapai batas maksimal murid untuk tanggal tersebut.';
      return;
    }
    const assignment = {
      tanggal: date,
      mentor_id: mentorId,
      siswa_id: studentId
    };
    const button = document.getElementById('assign-student-button');
    button.disabled = true;
    message.textContent = '';
    try {
      if (isDemoMode) {
        assignment.id = 'assignment-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        assignment.created_at = new Date().toISOString();
        data.penugasan_mentor.unshift(assignment);
        saveData('penugasan_mentor');
      } else {
        const saved = await saveRemoteRecord('penugasan_mentor', null, assignment);
        data.penugasan_mentor.unshift(saved);
      }
      renderView();
    } catch (error) {
      message.textContent = 'Tidak dapat menyimpan penugasan: ' + error.message;
      dashboardMessage.textContent = message.textContent;
    } finally {
      button.disabled = false;
    }
  }

  async function removeStudentAssignment(id) {
    const assignment = data.penugasan_mentor.find(function (item) { return item.id === id; });
    if (!assignment || !window.confirm('Hapus penugasan siswa pada tanggal ' + assignment.tanggal + '?')) return;
    try {
      if (isDemoMode) {
        data.penugasan_mentor = data.penugasan_mentor.filter(function (item) { return item.id !== id; });
        saveData('penugasan_mentor');
      } else {
        await deleteRemoteRecord('penugasan_mentor', id);
        data.penugasan_mentor = data.penugasan_mentor.filter(function (item) { return item.id !== id; });
      }
      renderView();
    } catch (error) {
      dashboardMessage.textContent = 'Tidak dapat menghapus penugasan: ' + error.message;
    }
  }

  const paymentSettingsForm = document.getElementById('payment-settings-form');
  if (paymentSettingsForm) {
    paymentSettingsForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const input = document.getElementById('global-payment-day');
      const day = Number(input.value);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        dashboardMessage.textContent = 'Tanggal pembayaran harus berupa angka antara 1 sampai 31.';
        return;
      }
      const settings = { id: 'global', tanggal_bayar: day };
      const button = paymentSettingsForm.querySelector('[type="submit"]');
      button.disabled = true;
      dashboardMessage.textContent = '';
      try {
        if (isDemoMode) {
          data.pengaturan[0] = settings;
          saveData('pengaturan');
        } else {
          const result = await authClient.from('pengaturan')
            .upsert(settings, { onConflict: 'id' })
            .select('*').single();
          if (result.error) throw new Error(result.error.message);
          data.pengaturan[0] = result.data;
        }
        await generateDueMentorPayments();
        renderView();
      } catch (error) {
        dashboardMessage.textContent = 'Tidak dapat menyimpan tanggal pembayaran: ' + error.message;
      } finally {
        button.disabled = false;
      }
    });
  }

  const globalPaymentDayInput = document.getElementById('global-payment-day');
  if (globalPaymentDayInput) globalPaymentDayInput.value = data.pengaturan[0].tanggal_bayar;

  document.querySelectorAll('[data-close-dialog]').forEach(function (button) {
    button.addEventListener('click', function () { dataDialog.close(); });
  });

  dataForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!editing) return;
    const formCollection = editing.collection;
    const collection = formCollection === 'mentor_settings' ? 'mentor' : formCollection;
    const editedId = editing.id;
    const values = Object.fromEntries(new FormData(dataForm).entries());
    if (formCollection === 'siswa' || formCollection === 'mentor') {
      const phoneField = collection === 'siswa' ? 'telepon_orang_tua' : 'telepon';
      const normalizedPhone = normalizeIndonesianPhone(values[phoneField]);
      if (!normalizedPhone) {
        formMessage.textContent = 'Masukkan nomor telepon Indonesia yang valid (contoh: 081234567890 atau +6281234567890).';
        document.getElementById('field-' + phoneField).focus();
        return;
      }
      values[phoneField] = normalizedPhone;
    }
    if (collection === 'siswa') {
      values.usia = Number(values.usia);
      const selectedProgram = data.program.find(function (program) { return program.id === values.program_id; });
      if (!selectedProgram) {
        formMessage.textContent = 'Pilih program yang tersedia sebelum menyimpan data siswa.';
        return;
      }
      values.program = selectedProgram.nama;
      values.spp = Number(selectedProgram.spp);
    }
    if (collection === 'keuangan' || collection === 'program' || collection === 'biaya_tetap') {
      values[collection === 'program' ? 'spp' : 'jumlah'] =
        Number(values[collection === 'program' ? 'spp' : 'jumlah']);
    }
    if (formCollection === 'mentor_settings') {
      values.kapasitas_murid = Number(values.kapasitas_murid);
      values.tarif_per_anak = Number(values.tarif_per_anak);
      values.tanggal_bayar = values.tanggal_bayar ? Number(values.tanggal_bayar) : null;
      if (values.kapasitas_murid < 1 || values.tarif_per_anak < 0
        || (values.tanggal_bayar !== null && (values.tanggal_bayar < 1 || values.tanggal_bayar > 31))) {
        formMessage.textContent = 'Periksa kembali kapasitas, tarif, dan tanggal pembayaran mentor.';
        return;
      }
      const dailyCounts = {};
      data.penugasan_mentor.filter(function (assignment) { return assignment.mentor_id === editing.id; })
        .forEach(function (assignment) {
          dailyCounts[assignment.tanggal] = (dailyCounts[assignment.tanggal] || 0) + 1;
        });
      if (Object.keys(dailyCounts).some(function (date) { return dailyCounts[date] > values.kapasitas_murid; })) {
        formMessage.textContent = 'Batas murid tidak boleh lebih kecil dari penugasan yang sudah terdaftar.';
        return;
      }
    }
    if (collection === 'program' && data.program.some(function (program) {
      return program.id !== editing.id && program.nama.trim().toLocaleLowerCase('id')
        === values.nama.trim().toLocaleLowerCase('id');
    })) {
      formMessage.textContent = 'Nama program sudah digunakan.';
      return;
    }
    const submitButton = dataForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    dashboardMessage.textContent = '';
    formMessage.textContent = '';
    try {
      let locallyPersisted = true;
      if (isDemoMode) {
        if (editing.id) {
          data[collection] = data[collection].map(function (item) {
            return item.id === editing.id ? Object.assign({}, item, values) : item;
          });
        } else {
          values.id = 'data-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
          values.created_at = new Date().toISOString();
          if (collection === 'mentor') {
            values.kapasitas_murid = 4;
            values.tarif_per_anak = 0;
            values.tanggal_bayar = null;
          }
          data[collection].unshift(values);
        }
        locallyPersisted = saveData(collection);
      } else {
        const savedRecord = await saveRemoteRecord(collection, editing.id, values);
        if (editing.id) {
          data[collection] = data[collection].map(function (item) {
            return item.id === editing.id ? savedRecord : item;
          });
        } else {
          data[collection].unshift(savedRecord);
        }
      }
      dataDialog.close();
      editing = null;
      renderView();
      if (locallyPersisted) dashboardMessage.textContent = '';
      if (formCollection === 'mentor_settings') {
        const mentor = data.mentor.find(function (item) { return item.id === editedId; });
        if (mentor) Object.assign(mentor, values);
        if (isDemoMode) saveData('mentor');
        try {
          await generateDueMentorPayments();
        } catch (error) {
          dashboardMessage.textContent = 'Pengaturan tersimpan, tetapi pembayaran mentor belum dapat dicatat: ' + error.message;
        }
      }
    } catch (error) {
      const message = 'Tidak dapat menyimpan data: ' + error.message;
      dashboardMessage.textContent = message;
      formMessage.textContent = message;
    } finally {
      submitButton.disabled = false;
    }
  });

  dataDialog.addEventListener('click', function (event) {
    if (event.target === dataDialog) dataDialog.close();
  });

  dialogFields.addEventListener('change', function (event) {
    if (event.target.id === 'field-program_id') updateProgramFeePreview();
  });

  function updateProgramFeePreview() {
    const select = document.getElementById('field-program_id');
    const preview = document.getElementById('program-spp-preview');
    if (!select || !preview) return;
    const program = data.program.find(function (item) { return item.id === select.value; });
    preview.textContent = program ? 'SPP per bulan: ' + formatCurrency(program.spp) : '';
  }

  function normalizeIndonesianPhone(value) {
    const phone = String(value || '').replace(/[\s()-]/g, '');
    if (!/^(?:\+?62|0)8\d{8,11}$/.test(phone)) return '';
    const digits = phone.replace(/^\+/, '');
    return digits.indexOf('08') === 0 ? '+62' + digits.slice(1) : '+' + digits;
  }

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
      isDemoMode = true;
      showDashboard({ email: 'demo@jarimath.local' }, true);
      try {
        await generateDueMentorPayments();
        renderView();
      } catch (error) {
        dashboardMessage.textContent = 'Tidak dapat menghitung pembayaran mentor: ' + error.message;
      }
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
      viewContainer.hidden = true;
      dashboardMessage.textContent = '';
      try {
        await loadRemoteData();
      } catch (error) {
        dashboardMessage.textContent = 'Tidak dapat memuat data dari Supabase: ' + error.message;
        return;
      }
      viewContainer.hidden = false;
      showDashboard(sessionData.session.user, false);
      try {
        await generateDueMentorPayments();
        renderView();
      } catch (error) {
        dashboardMessage.textContent = 'Tidak dapat menghitung pembayaran mentor: ' + error.message;
      }
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
