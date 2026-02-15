/**
 * Life RMiP - PWA Features
 * =========================
 * Offline banner, toast notifications, install prompt, auto-refresh
 */

// ============================================================
// TOAST NOTIFICATIONS (zamiast alert())
// ============================================================

const toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
        z-index: 10000; display: flex; flex-direction: column; gap: 8px;
        align-items: center; width: 90%; max-width: 400px; pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 3000) {
    const el = document.createElement('div');

    const colors = {
      success: { bg: '#4CAF50', icon: 'check_circle' },
      error:   { bg: '#F44336', icon: 'error' },
      warning: { bg: '#FF9800', icon: 'warning' },
      info:    { bg: '#2196F3', icon: 'info' },
      gps:     { bg: '#4CAF50', icon: 'gps_fixed' },
      offline: { bg: '#616161', icon: 'cloud_off' }
    };

    const c = colors[type] || colors.info;

    el.style.cssText = `
      display: flex; align-items: center; gap: 10px;
      background: ${c.bg}; color: #fff; padding: 12px 20px;
      border-radius: 12px; font-size: 14px; font-weight: 500;
      font-family: 'Inter', 'Roboto', sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      pointer-events: auto; cursor: pointer;
      animation: toastIn 0.3s ease-out;
      max-width: 100%; word-break: break-word;
    `;

    el.innerHTML = `
      <span class="material-icons-round" style="font-size:20px;flex-shrink:0">${c.icon}</span>
      <span>${message}</span>
    `;

    el.addEventListener('click', () => dismiss(el));
    getContainer().appendChild(el);

    if (duration > 0) {
      setTimeout(() => dismiss(el), duration);
    }

    return el;
  }

  function dismiss(el) {
    el.style.animation = 'toastOut 0.2s ease-in forwards';
    setTimeout(() => el.remove(), 200);
  }

  // CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(-20px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(-10px) scale(0.95); }
    }
  `;
  document.head.appendChild(style);

  return {
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error', dur || 4000),
    warning: (msg, dur) => show(msg, 'warning', dur),
    info:    (msg, dur) => show(msg, 'info', dur),
    gps:     (msg, dur) => show(msg, 'gps', dur),
    offline: (msg, dur) => show(msg, 'offline', dur || 0),
    dismiss: dismiss
  };
})();


// ============================================================
// OFFLINE / ONLINE BANNER
// ============================================================

const offlineBanner = (() => {
  let banner = null;

  function create() {
    banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.style.cssText = `
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #424242; color: #fff;
      padding: 10px 16px; text-align: center;
      font-size: 13px; font-weight: 500;
      font-family: 'Inter', 'Roboto', sans-serif;
      z-index: 9999; display: none;
      animation: slideUp 0.3s ease-out;
    `;
    banner.innerHTML = `
      <span class="material-icons-round" style="font-size:16px;vertical-align:middle;margin-right:6px">cloud_off</span>
      Brak połączenia z internetem. Dane mogą być nieaktualne.
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      @keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);
  }

  function update() {
    if (!banner) create();

    if (!navigator.onLine) {
      banner.style.display = 'block';
      banner.style.animation = 'slideUp 0.3s ease-out';
    } else {
      if (banner.style.display === 'block') {
        banner.style.animation = 'slideDown 0.3s ease-in forwards';
        setTimeout(() => { banner.style.display = 'none'; }, 300);
        toast.success('Połączenie przywrócone', 2000);
      }
    }
  }

  window.addEventListener('online', update);
  window.addEventListener('offline', update);

  // Initial check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }

  return { update };
})();


// ============================================================
// PWA INSTALL PROMPT
// ============================================================

const pwaInstall = (() => {
  let deferredPrompt = null;
  let installBanner = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  function showInstallBanner() {
    // Pokaż tylko na stronie logowania
    if (!document.getElementById('start-work-btn')) return;

    installBanner = document.createElement('div');
    installBanner.id = 'install-banner';
    installBanner.style.cssText = `
      position: fixed; bottom: 16px; left: 16px; right: 16px;
      background: linear-gradient(135deg, #B71C1C, #D32F2F);
      color: #fff; padding: 16px; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(183,28,28,0.4);
      z-index: 9998; display: flex; align-items: center; gap: 12px;
      font-family: 'Inter', 'Roboto', sans-serif;
      animation: toastIn 0.4s ease-out;
    `;
    installBanner.innerHTML = `
      <span class="material-icons-round" style="font-size:32px;opacity:0.9">install_mobile</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px">Zainstaluj Life RMiP</div>
        <div style="font-size:12px;opacity:0.85;margin-top:2px">Szybki dostęp z ekranu głównego</div>
      </div>
      <button id="install-btn" style="
        background: #fff; color: #B71C1C; border: none;
        padding: 8px 16px; border-radius: 8px;
        font-weight: 700; font-size: 13px; cursor: pointer;
        white-space: nowrap;
      ">Instaluj</button>
      <button id="install-dismiss" style="
        background: none; border: none; color: #fff; opacity: 0.7;
        cursor: pointer; padding: 4px; font-size: 18px; line-height: 1;
      ">&times;</button>
    `;

    document.body.appendChild(installBanner);

    document.getElementById('install-btn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          toast.success('Aplikacja zainstalowana!');
        }
        deferredPrompt = null;
        dismissBanner();
      }
    });

    document.getElementById('install-dismiss').addEventListener('click', dismissBanner);
  }

  function dismissBanner() {
    if (installBanner) {
      installBanner.style.animation = 'toastOut 0.3s ease-in forwards';
      setTimeout(() => installBanner.remove(), 300);
      installBanner = null;
    }
  }

  return { showInstallBanner, dismissBanner };
})();


// ============================================================
// AUTO-REFRESH ORDERS (co 30 sekund)
// ============================================================

const autoRefresh = (() => {
  let interval = null;
  let callback = null;
  let paused = false;

  function start(refreshFn, intervalMs = 30000) {
    callback = refreshFn;
    stop(); // Clear previous
    interval = setInterval(() => {
      if (!paused && navigator.onLine && document.visibilityState === 'visible') {
        callback();
      }
    }, intervalMs);

    // Refresh on visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible' && navigator.onLine && callback) {
      callback();
    }
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  function pause() { paused = true; }
  function resume() { paused = false; }

  return { start, stop, pause, resume };
})();


// ============================================================
// SERVICE WORKER REGISTRATION + UPDATE PROMPT
// ============================================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    // Check for updates every 5 min
    setInterval(() => reg.update(), 5 * 60 * 1000);

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
          toast.info('Nowa wersja dostępna. Odśwież stronę.', 5000);
        }
      });
    });
  });
}
