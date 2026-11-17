import {initConsent} from './consent.js';
// The docs site deliberately has no analytics property of its own.
initConsent({domain:'flowsteward.org',measurementId:'',policyLinks:[]}).catch(error => console.error('Privacy controls could not initialize',error));
