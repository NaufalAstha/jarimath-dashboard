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
      { id: 's-1', nama: 'Alya Putri', asal_sekolah: 'SD Nusantara', usia: 8, telepon_orang_tua: '081234567890', nama_orang_tua: 'Budi Putra', program_id: 'p-1', program: 'Matematika dasar', spp: 350000, tanggal_bergabung: '2026-10-15', hari_les_1: 2, jam_les_1: '14:00', hari_les_2: 5, jam_les_2: '14:00', status: 'Aktif' },
      { id: 's-2', nama: 'Rafi Pratama', asal_sekolah: 'SD Merdeka', usia: 7, telepon_orang_tua: '081298765432', nama_orang_tua: 'Siti Pratama', program_id: 'p-2', program: 'Berhitung ceria', spp: 350000, tanggal_bergabung: '2026-10-20', hari_les_1: 1, jam_les_1: '15:00', hari_les_2: 4, jam_les_2: '15:00', status: 'Aktif' },
      { id: 's-3', nama: 'Nadia Zahra', asal_sekolah: 'SD Harapan', usia: 9, telepon_orang_tua: '081234567891', nama_orang_tua: 'Dewi Zahra', program_id: 'p-1', program: 'Matematika dasar', spp: 350000, tanggal_bergabung: '2026-10-12', hari_les_1: 3, jam_les_1: '16:00', hari_les_2: 6, jam_les_2: '16:00', status: 'Menunggu' }
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
    pengaturan: [{
      id: 'global', tanggal_bayar: 5, nama_rekening: '', nomor_rekening: '',
      nama_pemilik_rekening: '', qris_image: ''
    }]
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
  ['nama_rekening', 'nomor_rekening', 'nama_pemilik_rekening', 'qris_image'].forEach(function (key) {
    if (data.pengaturan[0][key] == null) data.pengaturan[0][key] = '';
  });

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

  // Hapus relasi terlebih dahulu karena tabel Supabase memakai ON DELETE RESTRICT.
  async function deleteRecordWithDependencies(collection, id) {
    const dependencies = collection === 'mentor'
      ? [['penugasan_mentor', 'mentor_id'], ['pembayaran_mentor', 'mentor_id']]
      : collection === 'siswa' ? [['penugasan_mentor', 'siswa_id']] : [];
    if (isDemoMode) {
      dependencies.forEach(function (dependency) {
        const key = dependency[0];
        data[key] = data[key].filter(function (record) { return record[dependency[1]] !== id; });
        saveData(key);
      });
      data[collection] = data[collection].filter(function (record) { return record.id !== id; });
      saveData(collection);
      return;
    }
    for (const dependency of dependencies) {
      const result = await authClient.from(dependency[0]).delete().eq(dependency[1], id);
      if (result.error) throw new Error(result.error.message);
    }
    await deleteRemoteRecord(collection, id);
    data[collection] = data[collection].filter(function (record) { return record.id !== id; });
    dependencies.forEach(function (dependency) {
      data[dependency[0]] = data[dependency[0]].filter(function (record) { return record[dependency[1]] !== id; });
    });
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
    const tbody = document.querySelector('#assignment-table tbody');
    if (!dateInput || !tbody) return;
    if (!dateInput.value) dateInput.value = formatDateKey(new Date());
    const date = dateInput.value;
    dateInput.min = formatDateKey(new Date());
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    const scheduledStudents = data.siswa.filter(function (student) {
      return student.status === 'Aktif'
        && student.tanggal_bergabung
        && student.tanggal_bergabung <= date
        && (Number(student.hari_les_1) === dayOfWeek || Number(student.hari_les_2) === dayOfWeek);
    });
    const rows = scheduledStudents.map(function (student) {
      const slot = Number(student.hari_les_1) === dayOfWeek ? 1 : 2;
      const startTime = student['jam_les_' + slot] || '00:00';
      const assignment = data.penugasan_mentor.find(function (item) {
        return item.tanggal === date && item.siswa_id === student.id;
      });
      const mentor = assignment && data.mentor.find(function (item) { return item.id === assignment.mentor_id; });
      const scheduledEnd = getLessonEnd(date, startTime);
      const attendanceEnd = assignment && assignment.hadir_at
        ? new Date(new Date(assignment.hadir_at).getTime() + 60 * 60 * 1000) : scheduledEnd;
      const completed = Boolean(assignment && assignment.hadir_at) && Date.now() >= attendanceEnd.getTime();
      const mentorOptions = getAvailableMentors(date, assignment && assignment.mentor_id, startTime, assignment && assignment.id)
        .map(function (item) {
          return '<option value="' + escapeHTML(item.id) + '"' + (mentor && item.id === mentor.id ? ' selected' : '') + '>'
            + escapeHTML(item.nama) + '</option>';
        }).join('');
      const mentorCell = assignment
        ? escapeHTML(mentor ? mentor.nama : 'Mentor dihapus')
        : '<div class="assignment-mentor-picker"><select aria-label="Pilih mentor untuk ' + escapeHTML(student.nama)
          + '" data-assignment-mentor="' + escapeHTML(student.id) + '">' + mentorOptions + '</select>'
          + '<button class="text-button" type="button" data-action="assign-student-row" data-student-id="'
          + escapeHTML(student.id) + '"' + (!mentorOptions ? ' disabled' : '') + '>Tetapkan</button></div>';
      const attendanceCell = !assignment ? 'Belum ditetapkan'
        : completed ? '<span class="status-pill status-active">Hadir · selesai</span>'
          : assignment.hadir_at ? '<span class="status-pill status-pending">Hadir · selesai ' + escapeHTML(formatTime(attendanceEnd)) + '</span>'
            : '<button class="text-button" type="button" data-action="mark-attendance" data-id="'
              + escapeHTML(assignment.id) + '" data-start="' + escapeHTML(startTime) + '">Absen hadir</button>';
      const actionCell = assignment ? '<button class="text-button text-danger" type="button" data-action="remove-assignment"'
        + ' data-id="' + escapeHTML(assignment.id) + '">Hapus</button>' : '—';
      return '<tr><td>' + escapeHTML(student.nama) + '</td><td>' + escapeHTML(startTime) + '–'
        + escapeHTML(formatTime(scheduledEnd)) + '</td><td>' + mentorCell + '</td><td>' + attendanceCell
        + '</td><td class="table-actions">' + actionCell + '</td></tr>';
    });
    tbody.innerHTML = rows.length ? rows.join('')
      : '<tr><td class="table-empty" colspan="5">Tidak ada siswa terjadwal untuk tanggal ini.</td></tr>';
    const message = document.getElementById('assignment-message');
    if (message) {
      const hasUnassignedStudents = scheduledStudents.some(function (student) {
        const alreadyAssigned = data.penugasan_mentor.some(function (assignment) {
          return assignment.tanggal === date && assignment.siswa_id === student.id;
        });
        const slot = Number(student.hari_les_1) === dayOfWeek ? 1 : 2;
        return !alreadyAssigned && getAvailableMentors(date, null, student['jam_les_' + slot] || '00:00').length > 0;
      });
      const unassigned = scheduledStudents.some(function (student) {
        return !data.penugasan_mentor.some(function (assignment) {
          return assignment.tanggal === date && assignment.siswa_id === student.id;
        });
      });
      message.textContent = unassigned && !hasUnassignedStudents
        ? 'Semua mentor telah mencapai batas murid pada jam les tersebut.' : '';
      message.hidden = !message.textContent;
    }
    renderInvoiceAlerts();
  }

  function getAvailableMentors(date, includeMentorId, startTime, excludeAssignmentId) {
    return data.mentor.filter(function (mentor) {
      return canAssignMentor(date, startTime || '00:00', mentor.id, excludeAssignmentId)
        || mentor.id === includeMentorId;
    });
  }

  function canAssignMentor(date, startTime, mentorId, excludeAssignmentId, capacityOverride) {
    const mentor = data.mentor.find(function (item) { return item.id === mentorId; });
    if (!mentor) return false;
    const events = [];
    data.penugasan_mentor.filter(function (assignment) {
      return assignment.tanggal === date && assignment.mentor_id === mentorId && assignment.id !== excludeAssignmentId;
    }).forEach(function (assignment) {
      const start = new Date(date + 'T' + (assignment.jam_mulai || '00:00') + ':00').getTime();
      events.push({ time: start, delta: 1 }, { time: start + 60 * 60 * 1000, delta: -1 });
    });
    const proposedStart = new Date(date + 'T' + startTime + ':00').getTime();
    events.push({ time: proposedStart, delta: 1 }, { time: proposedStart + 60 * 60 * 1000, delta: -1 });
    events.sort(function (left, right) { return left.time - right.time || left.delta - right.delta; });
    let concurrent = 0;
    let maximum = 0;
    events.forEach(function (entry) {
      concurrent += entry.delta;
      maximum = Math.max(maximum, concurrent);
    });
    return maximum <= Number(capacityOverride == null ? mentor.kapasitas_murid : capacityOverride);
  }

  function getLessonEnd(date, startTime) {
    const parts = startTime.split(':').map(Number);
    const end = new Date(date + 'T00:00:00');
    end.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
    end.setMinutes(end.getMinutes() + 60);
    return end;
  }

  function formatTime(date) {
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function weekdayName(day) {
    return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][day];
  }

  function getCompletedSessions(mentorId, monthKey) {
    return data.penugasan_mentor.filter(function (assignment) {
      const student = data.siswa.find(function (item) { return item.id === assignment.siswa_id; });
      if (assignment.mentor_id !== mentorId || !assignment.hadir_at || !student
        || String(assignment.tanggal).slice(0, 7) !== monthKey) return false;
      return Date.now() >= new Date(assignment.hadir_at).getTime() + 60 * 60 * 1000;
    });
  }

  function getMonthlyMentorEarnings(mentorId, monthKey) {
    const mentor = data.mentor.find(function (item) { return item.id === mentorId; });
    return getCompletedStudentCount(mentorId, monthKey)
      * Number(mentor ? mentor.tarif_per_anak : 0);
  }

  function getCompletedStudentCount(mentorId, monthKey) {
    return new Set(getCompletedSessions(mentorId, monthKey).map(function (assignment) {
      return assignment.siswa_id;
    })).size;
  }

  function renderInvoiceAlerts() {
    const tbody = document.querySelector('#invoice-alerts-table tbody');
    if (!tbody) return;
    const today = new Date();
    const todayKey = formatDateKey(today);
    const alerts = data.siswa.filter(function (student) {
      return student.status === 'Aktif' && student.tanggal_bergabung;
    }).map(function (student) {
      const joinDate = new Date(student.tanggal_bergabung + 'T00:00:00');
      if (Number.isNaN(joinDate.getTime())) return null;
      const dueDay = joinDate.getDate();
      const currentMonthLastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const useCurrentMonth = today.getDate() <= Math.min(dueDay, currentMonthLastDay);
      const dueDate = useCurrentMonth
        ? new Date(today.getFullYear(), today.getMonth(), Math.min(dueDay, currentMonthLastDay))
        : new Date(today.getFullYear(), today.getMonth() + 1,
          Math.min(dueDay, new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate()));
      const daysUntil = Math.round((dueDate.getTime() - new Date(todayKey + 'T00:00:00').getTime()) / 86400000);
      return daysUntil >= 0 && daysUntil <= 3
        ? { student: student, dueDate: formatDateKey(dueDate), daysUntil: daysUntil } : null;
    }).filter(Boolean);
    tbody.innerHTML = alerts.length ? alerts.map(function (alert) {
      const student = alert.student;
      const countdown = alert.daysUntil === 0 ? ' · jatuh tempo hari ini' : ' · ' + alert.daysUntil + ' hari lagi';
      return '<tr><td>' + escapeHTML(student.nama + countdown) + '</td><td>' + escapeHTML(alert.dueDate) + '</td><td>'
        + escapeHTML(student.program || '') + '</td><td>' + escapeHTML(formatCurrency(student.spp)) + '</td>'
        + '<td><button class="text-button" type="button" data-action="create-invoice" data-student-id="'
        + escapeHTML(student.id) + '" data-due-date="' + escapeHTML(alert.dueDate) + '">Buat invoice</button></td></tr>';
    }).join('') : '<tr><td class="table-empty" colspan="5">Tidak ada invoice yang mendekati jatuh tempo.</td></tr>';
  }

  function openStudentInvoice(studentId, dueDate) {
    const student = data.siswa.find(function (item) { return item.id === studentId; });
    const dialog = document.getElementById('invoice-dialog');
    const documentElement = document.getElementById('invoice-document');
    if (!student || !dialog || !documentElement) return;
    const due = new Date(dueDate + 'T00:00:00');
    const period = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(due);
    const issueDate = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
    const invoiceNumber = 'JK-' + dueDate.slice(0, 7).replace('-', '') + '-'
      + String(student.id).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
    const settings = data.pengaturan[0];
    const paymentDetail = [settings.nama_rekening, settings.nomor_rekening, settings.nama_pemilik_rekening]
      .filter(Boolean).join(' · ');
    documentElement.innerHTML = '<header class="invoice-brand"><strong>Jarimath Kids</strong>'
      + '<span>Invoice Pembayaran SPP</span></header><div class="invoice-title">INVOICE LES · PERIODE '
      + escapeHTML(period.toLocaleUpperCase('id')) + '</div><div class="invoice-meta"><p><b>No. Invoice</b><span>'
      + escapeHTML(invoiceNumber) + '</span></p><p><b>Tanggal dibuat</b><span>' + escapeHTML(issueDate) + '</span></p>'
      + '<p><b>Nama Siswa</b><span>' + escapeHTML(student.nama) + '</span></p><p><b>Program</b><span>'
      + escapeHTML(student.program || '') + '</span></p></div><table class="invoice-items"><thead><tr>'
      + '<th>Program yang diikuti</th><th>Qty</th><th>Harga</th><th>Total</th></tr></thead><tbody><tr><td>'
      + escapeHTML(student.program || '') + '</td><td>1 bulan</td><td>' + escapeHTML(formatCurrency(student.spp))
      + '</td><td>' + escapeHTML(formatCurrency(student.spp)) + '</td></tr></tbody><tfoot><tr><th colspan="3">Total yang harus dibayar</th><th>'
      + escapeHTML(formatCurrency(student.spp)) + '</th></tr></tfoot></table><section class="invoice-payment"><b>Pembayaran</b>'
      + '<p>' + escapeHTML(paymentDetail || settings.nama_rekening || 'Informasi pembayaran belum diatur.')
      + '</p>' + (settings.qris_image ? '<img src="' + escapeHTML(settings.qris_image) + '" alt="QRIS Jarimath Kids">' : '')
      + '</section>';
    const phone = normalizeIndonesianPhone(student.telepon_orang_tua);
    const message = 'Halo ' + (student.nama_orang_tua || 'Orang Tua') + ', berikut invoice SPP Jarimath Kids.\n'
      + 'No. Invoice: ' + invoiceNumber + '\nPeriode: ' + period + '\nNama siswa: ' + student.nama
      + '\nProgram: ' + (student.program || '-') + '\nTotal: ' + formatCurrency(student.spp)
      + '\nJatuh tempo: ' + dueDate + (paymentDetail ? '\nPembayaran: ' + paymentDetail : '');
    const whatsappButton = document.getElementById('invoice-whatsapp-button');
    if (whatsappButton) {
      whatsappButton.href = phone ? 'https://wa.me/' + phone.replace(/\D/g, '') + '?text=' + encodeURIComponent(message) : '#';
      whatsappButton.setAttribute('aria-disabled', phone ? 'false' : 'true');
      whatsappButton.title = phone ? 'Buka WhatsApp dengan detail invoice' : 'Nomor telepon orang tua tidak valid';
    }
    dialog.showModal();
  }

  const invoiceDialog = document.getElementById('invoice-dialog');
  if (invoiceDialog) {
    invoiceDialog.querySelectorAll('[data-close-invoice]').forEach(function (button) {
      button.addEventListener('click', function () { invoiceDialog.close(); });
    });
    invoiceDialog.addEventListener('click', function (event) {
      if (event.target === invoiceDialog) invoiceDialog.close();
    });
    async function downloadInvoice(format) {
      const invoiceDocument = document.getElementById('invoice-document');
      const button = format === 'pdf' ? document.getElementById('invoice-download-pdf-button') : document.getElementById('invoice-download-image-button');
      if (!invoiceDocument || !button || !window.html2canvas) return;
      const label = button.textContent;
      button.disabled = true;
      button.textContent = 'Menyiapkan...';
      try {
        const canvas = await window.html2canvas(invoiceDocument, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        const filename = 'invoice-jarimath-' + new Date().toISOString().slice(0, 10);
        if (format === 'image') {
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = filename + '.png';
          link.click();
        } else {
          if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('Library PDF tidak berhasil dimuat.');
          const pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
          const width = pdf.internal.pageSize.getWidth();
          const height = canvas.height * width / canvas.width;
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
          pdf.save(filename + '.pdf');
        }
      } catch (error) {
        dashboardMessage.textContent = 'Invoice tidak dapat diunduh: ' + error.message;
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    }
    const printButton = document.getElementById('invoice-print-button');
    if (printButton) printButton.addEventListener('click', function () {
      document.body.classList.add('printing-invoice');
      window.print();
      window.setTimeout(function () { document.body.classList.remove('printing-invoice'); }, 500);
    });
    const imageButton = document.getElementById('invoice-download-image-button');
    const pdfButton = document.getElementById('invoice-download-pdf-button');
    if (imageButton) imageButton.addEventListener('click', function () { downloadInvoice('image'); });
    if (pdfButton) pdfButton.addEventListener('click', function () { downloadInvoice('pdf'); });
  }

  const invoiceCreatorDialog = document.getElementById('invoice-creator-dialog');
  const invoiceCreatorForm = document.getElementById('invoice-creator-form');
  const openInvoiceCreator = document.getElementById('open-invoice-creator');
  if (invoiceCreatorDialog && invoiceCreatorForm && openInvoiceCreator) {
    const studentSelect = document.getElementById('invoice-student-select');
    const creatorMessage = document.getElementById('invoice-creator-message');
    openInvoiceCreator.addEventListener('click', function () {
      const students = data.siswa.filter(function (student) { return student.status === 'Aktif'; });
      studentSelect.innerHTML = '<option value="">Pilih siswa</option>' + students.map(function (student) {
        return '<option value="' + escapeHTML(student.id) + '">' + escapeHTML(student.nama) + '</option>';
      }).join('');
      creatorMessage.textContent = students.length ? '' : 'Belum ada siswa aktif yang dapat dibuatkan invoice.';
      invoiceCreatorDialog.showModal();
    });
    invoiceCreatorDialog.querySelectorAll('[data-close-invoice-creator]').forEach(function (button) {
      button.addEventListener('click', function () { invoiceCreatorDialog.close(); });
    });
    invoiceCreatorForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!studentSelect.value) return;
      invoiceCreatorDialog.close();
      openStudentInvoice(studentSelect.value, formatDateKey(new Date()));
    });
  }
  async function generateDueMentorPayments() {
    const todayKey = formatDateKey(new Date());
    const globalPaymentDay = Number(data.pengaturan[0].tanggal_bayar) || 5;
    const periods = {};
    data.penugasan_mentor.forEach(function (assignment) {
      if (!assignment.tanggal || assignment.tanggal > todayKey || !assignment.hadir_at) return;
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
        if (paymentDateKey > todayKey) continue;
        const studentCount = getCompletedStudentCount(mentor.id, monthKey);
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
        const existingPayment = data.pembayaran_mentor.find(function (payment) {
          return payment.mentor_id === mentor.id && payment.periode === monthKey + '-01';
        });
        if (existingPayment && Number(existingPayment.jumlah_siswa) === studentCount
          && Number(existingPayment.jumlah) === amount && existingPayment.tanggal_bayar === paymentDateKey) continue;
        if (isDemoMode) {
          values.id = existingPayment ? existingPayment.id : 'mentor-pay-' + mentor.id + '-' + monthKey;
          values.created_at = paymentDateKey + 'T12:00:00';
          if (existingPayment) Object.assign(existingPayment, values);
          else data.pembayaran_mentor.push(values);
          saveData('pembayaran_mentor');
        } else {
          const result = await authClient.from('pembayaran_mentor')
            .upsert(values, { onConflict: 'mentor_id,periode' })
            .select('*').single();
          if (result.error) throw new Error('Tidak dapat mencatat pembayaran mentor: ' + result.error.message);
          const existingIndex = data.pembayaran_mentor.findIndex(function (payment) {
            return payment.mentor_id === mentor.id && payment.periode === monthKey + '-01';
          });
          if (existingIndex === -1) data.pembayaran_mentor.push(result.data);
          else data.pembayaran_mentor[existingIndex] = result.data;
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
        ['program', 'Program'], ['spp', 'SPP/bulan'], ['tanggal_bergabung', 'Tanggal bergabung'],
        ['jadwal', 'Jadwal les'], ['status', 'Status']]
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
      if (collection === 'siswa' && columnName === 'jadwal') {
        value = [1, 2].map(function (slot) {
          const day = item['hari_les_' + slot];
          const time = item['jam_les_' + slot];
          return Number.isInteger(Number(day)) && time
            ? weekdayName(Number(day)) + ' ' + time : '';
        }).filter(Boolean).join(' · ');
      }
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
        ['tanggal_bergabung', 'Tanggal bergabung', 'date', item && item.tanggal_bergabung],
        ['hari_les_1', 'Hari les pertama', 'weekday', item ? item.hari_les_1 == null ? 1 : item.hari_les_1 : 1],
        ['jam_les_1', 'Jam mulai les pertama', 'time', item ? item.jam_les_1 || '14:00' : '14:00'],
        ['hari_les_2', 'Hari les kedua', 'weekday', item ? item.hari_les_2 == null ? 4 : item.hari_les_2 : 4],
        ['jam_les_2', 'Jam mulai les kedua', 'time', item ? item.jam_les_2 || '14:00' : '14:00'],
        ['status', 'Status', 'select', item && item.status]
      ]
      : collection === 'mentor'
        ? [
          ['nama', 'Nama mentor', 'text', item && item.nama],
          ['telepon', 'Nomor telepon', 'tel', item && item.telepon]
        ]
        : collection === 'mentor_settings'
          ? [
            ['kapasitas_murid', 'Maksimal murid yang diajar bersamaan', 'number', item && item.kapasitas_murid],
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
      if (field[2] === 'select' || field[2] === 'transaction' || field[2] === 'program' || field[2] === 'weekday') {
        const options = field[2] === 'select' ? ['Aktif', 'Menunggu']
          : field[2] === 'transaction' ? ['Pemasukan', 'Pengeluaran']
            : field[2] === 'weekday' ? [0, 1, 2, 3, 4, 5, 6].map(String)
            : data.program.map(function (program) { return program.id; });
        const optionLabels = field[2] === 'program'
          ? data.program.map(function (program) {
            return program.nama + ' — SPP ' + formatCurrency(program.spp);
          }) : field[2] === 'weekday' ? options.map(function (day) { return weekdayName(Number(day)); }) : options;
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
        + (field[2] === 'time' ? ' step="1800"' : '')
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
    if (collection === 'siswa' && !item) {
      document.getElementById('field-tanggal_bergabung').value = formatDateKey(new Date());
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
    if (action === 'remove-assignment') {
      removeStudentAssignment(button.dataset.id);
      return;
    }
    if (action === 'assign-student-row') {
      assignStudentForDate(button.dataset.studentId,
        button.closest('tr').querySelector('[data-assignment-mentor]').value, button);
      return;
    }
    if (action === 'mark-attendance') {
      markStudentAttendance(button.dataset.id, button.dataset.start);
      return;
    }
    if (action === 'create-invoice') {
      openStudentInvoice(button.dataset.studentId, button.dataset.dueDate);
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
          await deleteRecordWithDependencies(collection, item.id);
          renderView();
        } catch (error) {
          dashboardMessage.textContent = 'Tidak dapat menghapus data: ' + error.message;
          button.disabled = false;
        }
      })();
    }
  });

  async function assignStudentForDate(studentId, mentorId, button) {
    const date = document.getElementById('assignment-date').value;
    const message = document.getElementById('assignment-message');
    const mentor = data.mentor.find(function (item) { return item.id === mentorId; });
    const student = data.siswa.find(function (item) { return item.id === studentId; });
    if (!date || !mentor || !student) {
      message.textContent = 'Pilih tanggal, mentor, dan siswa sebelum membuat penugasan.';
      return;
    }
    if (date < formatDateKey(new Date())) {
      message.textContent = 'Penugasan baru hanya dapat dibuat untuk hari ini atau tanggal mendatang.';
      return;
    }
    if (data.penugasan_mentor.some(function (item) { return item.tanggal === date && item.siswa_id === studentId; })) {
      message.textContent = 'Siswa sudah mendapat mentor pada tanggal tersebut.';
      return;
    }
    const assignment = {
      tanggal: date,
      mentor_id: mentorId,
      siswa_id: studentId,
      jam_mulai: Number(student.hari_les_1) === new Date(date + 'T12:00:00').getDay()
        ? student.jam_les_1 : student.jam_les_2
    };
    if (!canAssignMentor(date, assignment.jam_mulai, mentorId)) {
      message.textContent = 'Mentor sudah mencapai batas maksimal siswa pada jam tersebut.';
      return;
    }
    if (button) button.disabled = true;
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
      if (button) button.disabled = false;
    }
  }

  async function markStudentAttendance(id, startTime) {
    const assignment = data.penugasan_mentor.find(function (item) { return item.id === id; });
    if (!assignment) return;
    const start = new Date(assignment.tanggal + 'T' + startTime + ':00');
    if (Date.now() < start.getTime()) {
      dashboardMessage.textContent = 'Absensi bisa dilakukan mulai jam les yang dijadwalkan (' + startTime + ').';
      return;
    }
    const values = Object.assign({}, assignment, { hadir_at: new Date().toISOString() });
    try {
      if (isDemoMode) {
        data.penugasan_mentor = data.penugasan_mentor.map(function (item) {
          return item.id === id ? values : item;
        });
        saveData('penugasan_mentor');
      } else {
        const saved = await saveRemoteRecord('penugasan_mentor', id, { hadir_at: values.hadir_at });
        data.penugasan_mentor = data.penugasan_mentor.map(function (item) {
          return item.id === id ? saved : item;
        });
      }
      await generateDueMentorPayments();
      renderView();
      dashboardMessage.textContent = 'Kehadiran tercatat. Pendapatan mentor bertambah setelah sesi 60 menit selesai.';
    } catch (error) {
      dashboardMessage.textContent = 'Tidak dapat mencatat kehadiran: ' + error.message;
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
      const settings = Object.assign({}, data.pengaturan[0], { id: 'global', tanggal_bayar: day });
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
      values.hari_les_1 = Number(values.hari_les_1);
      values.hari_les_2 = Number(values.hari_les_2);
      if (values.hari_les_1 === values.hari_les_2) {
        formMessage.textContent = 'Pilih dua hari les yang berbeda.';
        return;
      }
      const selectedProgram = data.program.find(function (program) { return program.id === values.program_id; });
      if (!selectedProgram || !values.tanggal_bergabung || !values.jam_les_1 || !values.jam_les_2) {
        formMessage.textContent = 'Lengkapi tanggal bergabung, dua jadwal les, dan program siswa.';
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
      const dates = new Set(data.penugasan_mentor.filter(function (assignment) {
        return assignment.mentor_id === editing.id;
      }).map(function (assignment) { return assignment.tanggal; }));
      if (Array.from(dates).some(function (date) {
        const starts = data.penugasan_mentor.filter(function (assignment) {
          return assignment.tanggal === date && assignment.mentor_id === editing.id && assignment.jam_mulai;
        });
        return starts.some(function (assignment) {
          return !canAssignMentor(date, assignment.jam_mulai, editing.id, assignment.id, values.kapasitas_murid);
        });
      })) {
        formMessage.textContent = 'Batas siswa tidak boleh lebih kecil dari jumlah penugasan yang bersamaan.';
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

  window.setInterval(async function () {
    if (currentView !== 'dashboard' || document.hidden) return;
    try {
      await generateDueMentorPayments();
      renderView();
    } catch (error) {
      dashboardMessage.textContent = 'Tidak dapat memperbarui pendapatan mentor: ' + error.message;
    }
  }, 30000);

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
