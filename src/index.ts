export { default as TeamsAuthenticator } from './auth-service';

// Export Teams JS SDK with SSR support
let teamsSdk = {};
if (typeof window !== 'undefined') {
  teamsSdk = require('@microsoft/teams-js');
}

import type * as TeamsJs from '@microsoft/teams-js';
export const microsoftTeams = teamsSdk as typeof TeamsJs;

export function isInsideIframe() {
  try {
    return window && window.self !== window.top;
  } catch (e) {
    return true;
  }
}
