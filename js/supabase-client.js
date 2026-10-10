(function () {
  window.createJarimathSupabaseClient = function () {
    const config = window.JARIMATH_SUPABASE_CONFIG;
    if (!window.supabase) {
      throw new Error('Library Supabase tidak berhasil dimuat. Periksa koneksi internet lalu muat ulang halaman.');
    }
    if (!config || !config.url || !config.anonKey
      || config.url.includes('YOUR_PROJECT_ID')
      || config.anonKey.includes('YOUR_SUPABASE_ANON_KEY')
      || /^\*+$/.test(config.anonKey)) {
      throw new Error('URL dan anon key Supabase belum dikonfigurasi dengan benar di js/config.js.');
    }
    try {
      return window.supabase.createClient(config.url, config.anonKey);
    } catch (error) {
      throw new Error('Konfigurasi Supabase tidak valid: ' + error.message);
    }
  };
})();
