import {initConsent} from './consent.js?v=1.1.0';
// Same GA4 web stream as the main site; CookieConsent controls all tag loading.
initConsent({domain:'flowsteward.org',measurementId:'G-F7JFTT4K8M',policyLinks:[]}).catch(error => console.error('Privacy controls could not initialize',error));
