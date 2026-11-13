const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobile-nav');
if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const opened = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!opened));
    menuButton.setAttribute('aria-label', opened ? 'Open navigation' : 'Close navigation');
    mobileMenu.hidden = opened;
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      mobileMenu.hidden = true;
    });
  });
}


/**
 * VIARUM App Store linking
 *
 * On each page visit, check Apple's public App Store catalog for VIARUM's
 * exact iOS bundle identifier. Once published in the visitor's storefront,
 * every "Get the App" button is automatically linked to that real listing.
 * Before launch, buttons lead to the dedicated Coming Soon page.
 *
 * Once VIARUM's numeric Apple ID is available, this can be simplified to
 * a permanent direct App Store URL, without depending on lookup requests.
 */
(() => {
  'use strict';
  const BUNDLE_ID = 'app.rork.ppt6pnqp1w9l67o9vwz8a';
  const storeLinks = Array.from(document.querySelectorAll('[data-viarum-store-link]'));
  if (!storeLinks.length) return;
  const status = document.getElementById('viarum-app-store-status');
  let liveUrl = null;

  function enableStore(url) {
    if (!/^https:\/\/apps\.apple\.com\//i.test(url)) return;
    liveUrl = url;
    storeLinks.forEach((link) => {
      link.href = url;
      link.setAttribute('aria-label', 'Download VIARUM on the App Store');
      link.setAttribute('rel', 'noopener noreferrer');
      link.dataset.storeReady = 'true';
    });
    if (status) {
      status.textContent =
        'VIARUM is on the App Store. Download the app and take your next drive further.';
    }
  }

  function localizedCountry() {
    const language = (navigator.language || '').replace('_', '-');
    const segments = language.split('-');
    const region = segments.find((segment, index) => index > 0 && /^[a-z]{2}$/i.test(segment));
    return region ? region.toLowerCase() : 'us';
  }

  function requestListing(country) {
    return new Promise((resolve) => {
      // Apple's public iTunes Search API supports JSONP. Unlike a cross-origin
      // fetch, this still works in browsers without Access-Control-Allow-Origin.
      const callback = 'viarumStoreLookup_' + Math.random().toString(36).slice(2);
      const tag = document.createElement('script');
      let done = false;
      const timeout = setTimeout(() => finish(null), 4800);

      function finish(value) {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        tag.remove();
        try { delete window[callback]; } catch (_) { window[callback] = undefined; }
        resolve(value);
      }

      window[callback] = (response) => {
        const listing = Array.isArray(response?.results)
          ? response.results.find((item) =>
              item && item.bundleId === BUNDLE_ID &&
              typeof item.trackViewUrl === 'string')
          : null;
        finish(listing ? listing.trackViewUrl : null);
      };
      tag.onerror = () => finish(null);
      tag.src = 'https://itunes.apple.com/lookup?bundleId=' +
        encodeURIComponent(BUNDLE_ID) + '&country=' + encodeURIComponent(country) +
        '&entity=software&callback=' + encodeURIComponent(callback);
      document.head.appendChild(tag);
    });
  }

  // If Apple is not yet listing VIARUM, do not send visitors to a generic
  // search result or an unrelated app. Preserve the existing Coming Soon link.
  async function activateWhenReleased() {
    const countries = [...new Set([localizedCountry(), 'ca', 'us'])];
    for (const country of countries) {
      const url = await requestListing(country);
      if (url) {
        enableStore(url);
        return;
      }
    }
  }
  activateWhenReleased();
})();

(function launchPreview() {
  const phone = document.querySelector('[data-launch-preview]');
  if (!phone) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const video = phone.querySelector('video');
  const replay = phone.querySelector('button');
  const screen = phone.querySelector('.hero-map');
  const tabs = Array.from(document.querySelectorAll('[data-preview]'));
  const screens = {
    map: 'VIARUM Map showing automotive places and discovery tools',
    roads: 'VIARUM Iconic Roads and Route Passports',
    drive: 'VIARUM Drive screen with the AI Road Trip Planner'
  };
  let timers = [];

  function selectScreen(name) {
    screen.src = 'assets/' + name + '.webp';
    screen.alt = screens[name];
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.preview === name)));
  }

  function cancelPreview() {
    timers.forEach(timer => window.clearTimeout(timer));
    timers = [];
    video.pause();
    video.hidden = true;
  }

  function showScreens() {
    video.hidden = true;
    if (motion.matches) return;
    timers = [
      window.setTimeout(() => selectScreen('roads'), 1500),
      window.setTimeout(() => selectScreen('drive'), 3400)
    ];
  }

  function playPreview() {
    cancelPreview();
    selectScreen('map');
    if (motion.matches) return;
    if (!video.hasAttribute('src')) video.src = video.dataset.src;
    video.currentTime = 0;
    video.play().catch(error => {
      if (error.name !== 'AbortError') showScreens();
    });
  }

  video.addEventListener('playing', () => {
    if (!motion.matches) video.hidden = false;
  });
  video.addEventListener('ended', showScreens);
  tabs.forEach(tab => tab.addEventListener('click', () => {
    cancelPreview();
    selectScreen(tab.dataset.preview);
  }));
  replay.addEventListener('click', playPreview);
  motion.addEventListener('change', () => {
    cancelPreview();
    replay.hidden = motion.matches;
  });

  replay.hidden = motion.matches;
  if (!motion.matches) playPreview();
})();

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const previewObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in-view');
      previewObserver.unobserve(entry.target);
    }
  }, { threshold: 0.25 });
  document.querySelectorAll('.visual-roads, .visual-planner').forEach((preview) => previewObserver.observe(preview));
}
