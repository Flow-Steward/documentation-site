import * as CookieConsent from './vendor/cookieconsent.esm.js';

let started;
/** Shared by WordPress and static documentation; contains no third-party runtime dependency. */
export function initConsent(config = {}) {
  if (started) return started;
  started = run(config);
  return started;
}

async function run(config) {
  const id = /^G-[A-Z0-9]+$/.test(config.measurementId || '') ? config.measurementId : '';
  const domain = config.domain || location.hostname;
  const cookieName = 'fs_consent';
  const rawConsent = () => document.cookie.split('; ').find(row => row.startsWith(`${cookieName}=`)) || '';
  let observed = rawConsent();
  let tracking = false;
  let granted = false;
  // Google's tag consumes Arguments objects, as in its official bootstrap.
  function gtag() { (window.dataLayer = window.dataLayer || []).push(arguments); }
  const denyAds = {ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'};

  function updateConsent() {
    granted = CookieConsent.acceptedCategory('analytics');
    observed = rawConsent();
    // Stop the existing tag before any consent update could send a cookieless ping.
    if (id) window[`ga-disable-${id}`] = !granted;
    if (!granted && tracking) {
      location.reload();
      return;
    }
    if (typeof window.wp_set_consent === 'function') {
      window.wp_set_consent('statistics', granted ? 'allow' : 'deny');
      window.wp_set_consent('marketing', 'deny');
    }
    if (!granted || !id || tracking) return;
    tracking = true;
    window.gtag = gtag;
    gtag('consent', 'default', {...denyAds, analytics_storage: 'denied'});
    gtag('consent', 'update', {...denyAds, analytics_storage: 'granted'});
    gtag('set', {cookie_expires: 180 * 86400, cookie_update: false, allow_google_signals: false, allow_ad_personalization_signals: false});
    gtag('js', new Date());
    const safeUrl = value => { try { const url = new URL(value); return url.origin + url.pathname; } catch { return ''; } };
    gtag('config', id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 180 * 86400,
      cookie_update: false,
      page_location: safeUrl(location.href),
      page_referrer: safeUrl(document.referrer),
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.append(script);
  }
  const links = (config.policyLinks || []).filter(link => /^https:\/\//.test(link.url));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const footer = links.map(link => `<a href="${escape(link.url)}">${escape(link.label)}</a>`).join('');
  function pauseOnChangedChoice() {
    const changed = rawConsent() !== observed;
    if (changed && id) window[`ga-disable-${id}`] = true;
    return changed;
  }
  function synchronize() {
    if (!pauseOnChangedChoice() || document.visibilityState === 'hidden') return;
    // Cookie Store can notify before CookieConsent's deferred callback updates
    // observed. Let that callback commit our own choice; other-tab changes
    // remain different and reload. Tracking is already paused synchronously.
    requestAnimationFrame(() => setTimeout(() => {
      if (rawConsent() !== observed && document.visibilityState !== 'hidden') location.reload();
    }, 0));
  }
  // Register before loading GA: stop pagehide/engagement beacons synchronously,
  // including while CookieConsent's change callback is still queued.
  window.addEventListener('pagehide', pauseOnChangedChoice, true);
  document.addEventListener('visibilitychange', synchronize, true);
  window.addEventListener('pageshow', synchronize, true);
  window.addEventListener('focus', synchronize, true);
  await CookieConsent.run({
    mode: 'opt-in', revision: 2, autoShow: true, hideFromBots: true,
    disablePageInteraction: false,
    cookie: {name: cookieName, domain, path: '/', secure: true, sameSite: 'Lax', expiresAfterDays: 180},
    guiOptions: {
      consentModal: {layout: 'box inline', position: 'bottom right', equalWeightButtons: true, flipButtons: false},
      preferencesModal: {layout: 'box', equalWeightButtons: true, flipButtons: false},
    },
    categories: {
      necessary: {enabled: true, readOnly: true},
      analytics: {
        enabled: false,
        autoClear: {cookies: [{name: /^_ga(?:_|$)/, domain: `.${domain}`}, {name: /^_ga(?:_|$)/, domain: location.hostname}]},
      },
    },
    language: {default: 'en', translations: {en: {
      consentModal: {
        title: 'Your privacy, your choice',
        description: 'We use necessary storage to keep the site working and remember your choice. With your permission, Google Analytics helps us understand how the website and documentation are used. You can change your choice at any time in Cookie settings.',
        acceptAllBtn: 'Accept analytics', acceptNecessaryBtn: 'Reject', showPreferencesBtn: 'Settings',
        ...(footer ? {footer} : {}),
      },
      preferencesModal: {
        title: 'Cookie preferences', acceptAllBtn: 'Accept analytics', acceptNecessaryBtn: 'Reject', savePreferencesBtn: 'Save preferences', closeIconLabel: 'Close preferences',
        sections: [
          {description: 'UAB Seek Around, Lithuania, operates flowsteward.org and docs.flowsteward.org. Your choice is shared across these two sites and remembered for 180 days. Rejecting analytics does not limit access to the website or documentation.'},
          {title: 'Necessary', description: 'Always active. The fs_consent cookie remembers your privacy choice. WordPress also uses necessary login and security cookies when you access the administration area. Documentation may store interface preferences in your browser.', linkedCategory: 'necessary'},
          {title: 'Analytics', description: 'Optional. Google Analytics measures page visits and interactions on flowsteward.org and docs.flowsteward.org. Its tag is blocked until you accept. We configure _ga and _ga_* cookies for up to 180 days; browsers may shorten this. Withdrawing consent stops analytics and removes its accessible cookies. <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses information</a>.', linkedCategory: 'analytics'},
          ...(footer ? [{title: 'More information', description: footer}] : []),
        ],
      },
    }}},
    onConsent: updateConsent,
    onChange: updateConsent,
  });
  window.addEventListener('fs:cookie-settings', () => CookieConsent.showPreferences());
  observed = rawConsent();
  // Cookies are shared across subdomains; localStorage/BroadcastChannel are not.
  window.cookieStore?.addEventListener('change', event => {
    if ([...event.changed, ...event.deleted].some(cookie => cookie.name === cookieName)) synchronize();
  });
  window.setInterval(synchronize, 1000);
  return CookieConsent;
}
