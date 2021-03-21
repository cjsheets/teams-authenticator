import * as MSAL from '@azure/msal-browser';
import { IAuthService } from './types';

/*
 * Use MSAL.js to authenticate AAD or MSA accounts against AAD v2
 */
class MsalAuthService implements IAuthService {
  // https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html
  private app: MSAL.PublicClientApplication;
  private loginRequests: {
    silent: MSAL.SsoSilentRequest;
    interactive: MSAL.PopupRequest | MSAL.RedirectRequest;
  };
  private tokenRequests: {
    silent: { [scopes: string]: MSAL.SilentRequest };
    interactive: { [scopes: string]: MSAL.PopupRequest | MSAL.RedirectRequest };
  };

  constructor(private usePopup = false) {
    this.app = new MSAL.PublicClientApplication(this.config);

    this.tokenRequests = {
      silent: {},
      interactive: {},
    };

    this.loginRequests = {
      silent: {},
      interactive: { scopes: [] },
    };

    if (usePopup) {
      this.loginRequests.interactive.redirectUri = window.location.href;
    }
  }

  login() {
    return this.app.ssoSilent(this.loginRequests.silent).catch((error) => {
      console.error('Login Error: ' + error);
      if (error instanceof MSAL.InteractionRequiredAuthError) {
        this.loginInteractive();
      }
    });
  }

  private loginInteractive() {
    return this.usePopup
      ? this.app.loginPopup(this.loginRequests.interactive)
      : this.app.loginRedirect(this.loginRequests.interactive);
  }

  logout() {
    return this.app.logout();
  }

  handleCallback() {
    return this.app.handleRedirectPromise();
  }

  getUser() {
    return this.app.getAllAccounts()?.[0];
  }

  getToken(scopes: string[]) {
    const { silent, interactive } = this.tokenRequests;
    const key = scopes.join('');
    if (!silent[key]) silent[key] = { scopes };

    return this.app
      .acquireTokenSilent(silent[key])
      .then((res) => res.accessToken)
      .catch((e) => {
        if (!(e instanceof MSAL.InteractionRequiredAuthError)) {
          throw e;
        }

        if (!interactive[key]) interactive[key] = { scopes };
        const request = interactive[key];

        if (this.isRedirectRequest(request)) {
          request.redirectStartPage = window.location.href;
          return this.app.acquireTokenRedirect(request).then(() => '');
        } else {
          return this.app.acquireTokenPopup(request).then((res) => res.accessToken);
        }
      });
  }

  private isRedirectRequest(
    req: MSAL.PopupRequest | MSAL.RedirectRequest
  ): req is MSAL.RedirectRequest {
    return !this.usePopup;
  }

  get config() {
    return {
      auth: {
        clientId: process.env.CLIENT_ID,
        redirectUri: `${window.location.origin}/${process.env.MSAL_REDIRECT_PATH}`,
      },
    };
  }
}

export default MsalAuthService;
