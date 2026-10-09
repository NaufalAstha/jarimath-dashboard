(function () {
  const loginPage = document.getElementById('login-page');
  const dashboardPage = document.getElementById('dashboard-page');
  const loginForm = document.getElementById('login-form');
  const loginButton = document.getElementById('login-button');
  const loginMessage = document.getElementById('login-message');
  const logoutButton = document.getElementById('logout-button');
  const dashboardMessage = document.getElementById('dashboard-message');
  const accountEmail = document.getElementById('account-email');
  const config = window.JARIMATH_SUPABASE_CONFIG;
  const configured = config
    && config.url
    && config.anonKey
    && !config.url.includes('YOUR_PROJECT_ID')
    && !config.anonKey.includes('YOUR_SUPABASE_ANON_KEY');

  document.querySelector('[data-current-year]').textContent = new Date().getFullYear();
  document.getElementById('today-date').textContent = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());

  function showLogin(message, isInfo) {
    loginPage.hidden = false;
    dashboardPage.hidden = true;
    loginMessage.textContent = message || '';
    loginMessage.classList.toggle('is-info', Boolean(isInfo));
  }

  function showDashboard(user) {
    loginPage.hidden = true;
    dashboardPage.hidden = false;
    accountEmail.textContent = user.email || '';
    dashboardMessage.textContent = '';
  }

  if (!configured || !window.supabase) {
    showLogin('Hubungkan URL dan anon key Supabase terlebih dahulu. Lihat petunjuk di README.');
    loginMessage.classList.add('is-info');
    return;
  }

  const supabase = window.supabase.createClient(config.url, config.anonKey);

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    loginMessage.textContent = '';
    loginMessage.classList.remove('is-info');
    loginButton.disabled = true;
    loginButton.querySelector('span').textContent = 'Memeriksa akun...';

    try {
      const formData = new FormData(loginForm);
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.get('email').trim(),
        password: formData.get('password')
      });
      if (error) {
        loginMessage.textContent = 'Email atau password tidak sesuai. Silakan coba lagi.';
      }
    } catch {
      loginMessage.textContent = 'Tidak dapat terhubung. Periksa koneksi internet lalu coba lagi.';
    } finally {
      loginButton.disabled = false;
      loginButton.querySelector('span').textContent = 'Masuk ke dashboard';
    }
  });

  logoutButton.addEventListener('click', async function () {
    logoutButton.disabled = true;
    dashboardMessage.textContent = '';
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        dashboardMessage.textContent = 'Tidak dapat keluar. Silakan coba lagi.';
      }
    } catch {
      dashboardMessage.textContent = 'Tidak dapat keluar. Periksa koneksi internet lalu coba lagi.';
    } finally {
      logoutButton.disabled = false;
    }
  });

  supabase.auth.onAuthStateChange(function (event, session) {
    if (session && session.user) {
      showDashboard(session.user);
    } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
      showLogin('');
    }
  });
})();
