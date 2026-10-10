(function () {
  const loginForm = document.getElementById('login-form');
  const loginButton = document.getElementById('login-button');
  const loginMessage = document.getElementById('login-message');
  const demoButton = document.getElementById('demo-button');
  const configMessageKey = 'jarimath-login-message';
  const demoModeKey = 'jarimath-demo-mode';
  let supabaseClient = null;

  document.querySelector('[data-current-year]').textContent = new Date().getFullYear();

  function showMessage(message, isInfo) {
    loginMessage.textContent = message;
    loginMessage.classList.toggle('is-info', Boolean(isInfo));
  }

  function explainAuthError(error) {
    const message = String(error.message || '');
    if (error.status === 429 || error.code === 'over_request_rate_limit') {
      return 'Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.';
    }
    if (/email not confirmed/i.test(message) || error.code === 'email_not_confirmed') {
      return 'Email akun belum dikonfirmasi. Minta admin memeriksa status pengguna di Supabase.';
    }
    if (/invalid api key|apikey/i.test(message) || error.status === 401) {
      return 'Supabase menolak anon key. Periksa nilai anon/public key pada js/config.js.';
    }
    if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
      return 'Email atau password tidak cocok dengan akun Supabase. Periksa kembali email dan password.';
    }
    if (/fetch|network|failed to connect/i.test(message)) {
      return 'Tidak dapat menghubungi Supabase. Periksa koneksi internet dan Project URL.';
    }
    return 'Login gagal: ' + (message || 'Supabase tidak memberikan detail error.');
  }

  function redirectToDashboard() {
    window.location.replace('dashboard.html');
  }

  try {
    supabaseClient = window.createJarimathSupabaseClient();
  } catch (error) {
    loginButton.disabled = true;
    showMessage(error.message + ' Mode demo tetap bisa digunakan.', true);
  }

  try {
    const previousMessage = sessionStorage.getItem(configMessageKey);
    if (previousMessage) {
      showMessage(previousMessage, true);
      sessionStorage.removeItem(configMessageKey);
    }
  } catch (error) {
    showMessage('Penyimpanan sesi browser tidak tersedia. Login mungkin tidak bisa mempertahankan sesi.', true);
  }

  if (supabaseClient) {
    supabaseClient.auth.getSession().then(function (result) {
      if (result.error) {
        showMessage('Tidak dapat memeriksa sesi Supabase: ' + result.error.message, false);
        return;
      }
      if (result.data.session) redirectToDashboard();
    }).catch(function (error) {
      showMessage('Tidak dapat memeriksa sesi Supabase: ' + error.message, false);
    });
  }

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!supabaseClient) return;
    showMessage('', false);
    loginButton.disabled = true;
    loginButton.querySelector('span').textContent = 'Memeriksa akun...';

    try {
      const formData = new FormData(loginForm);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: String(formData.get('email')).trim(),
        password: String(formData.get('password'))
      });
      if (error) {
        showMessage(explainAuthError(error), false);
      } else if (data.session) {
        redirectToDashboard();
      } else {
        showMessage('Supabase tidak mengembalikan sesi login. Coba lagi atau hubungi admin.', false);
      }
    } catch (error) {
      showMessage('Login gagal: ' + (error.message || 'Terjadi kesalahan yang tidak diketahui.'), false);
    } finally {
      loginButton.disabled = !supabaseClient;
      loginButton.querySelector('span').textContent = 'Login';
    }
  });

  demoButton.addEventListener('click', function () {
    try {
      sessionStorage.setItem(demoModeKey, 'true');
      redirectToDashboard();
    } catch (error) {
      showMessage('Mode demo tidak dapat dimulai karena penyimpanan sesi browser tidak tersedia.', false);
    }
  });
})();
