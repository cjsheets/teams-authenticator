import * as MSAL from '@azure/msal-browser';
import { IAuthService } from './types';

/*
 * Use MSAL.js to authenticate AAD or MSA accounts against AAD v2
 */
class MsalAuthService implements IAuthService {
  // https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html
  private app: MSAL.PublicClientApplication;
  private account: MSAL.AccountInfo | null;

  private loginRequests: {
    silent: MSAL.SsoSilentRequest;
    interactive: MSAL.PopupRequest | MSAL.RedirectRequest;
  };

  private tokenRequests: {
    silent: { [scopes: string]: MSAL.SilentRequest };
    interactive: { [scopes: string]: MSAL.PopupRequest | MSAL.RedirectRequest };
  };

  constructor(private msalConfig: MSAL.Configuration, private usePopup = false) {
    this.app = new MSAL.PublicClientApplication(this.config);
    this.account = this.app.getAllAccounts()?.[0];

    this.tokenRequests = { silent: {}, interactive: {} };

    this.loginRequests = { silent: {}, interactive: { scopes: [] } };

    if (usePopup) this.loginRequests.interactive.redirectUri = window.location.href;
  }

  login() {
    return this.loginSilent().then(this.handleLoginResponse);
  }

  handleLoginRedirect() {
    return this.app.handleRedirectPromise(window.location.hash).then(this.handleLoginResponse);
  }

  logout() {
    return this.app.logout();
  }

  getUser() {
    return Promise.resolve(this.account);
  }

  getToken(scopes: string[]) {
    const { silent, interactive } = this.tokenRequests;
    const key = scopes.join('');
    if (!silent[key]) silent[key] = { scopes };
    silent[key].account = this.account;

    return this.app
      .acquireTokenSilent(silent[key])
      .then((res) => res.accessToken)
      .catch((e) => {
        console.log('caught', e instanceof MSAL.InteractionRequiredAuthError, e);
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

  private loginSilent() {
    return this.getUser().then((user) => {
      this.loginRequests.silent.loginHint = user?.username;
      return this.app.ssoSilent(this.loginRequests.silent).catch((error) => {
        console.error('Silent login failed, trying interactive', error);
        this.loginInteractive();
      });
    });
  }

  private loginInteractive() {
    const login = () =>
      this.usePopup
        ? this.app.loginPopup(this.loginRequests.interactive)
        : this.app.loginRedirect(this.loginRequests.interactive);

    return login().catch((e) => {
      if (e.message?.indexOf('interaction_in_progress') === 0) {
        window.sessionStorage.clear();
        return login() as Promise<MSAL.AuthenticationResult | void>;
      }

      throw e;
    });
  }

  private handleLoginResponse = (result: MSAL.AuthenticationResult) => {
    this.account = this.app.getAllAccounts()?.[0];
    return result;
  };

  private isRedirectRequest(
    req: MSAL.PopupRequest | MSAL.RedirectRequest
  ): req is MSAL.RedirectRequest {
    return !this.usePopup;
  }

  get config() {
    return {
      auth: {
        clientId: process.env.CLIENT_ID,
        authority: 'https://login.microsoftonline.com/organizations',
        redirectUri: `${window.location.origin}/`,
        ...this.msalConfig.auth,
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
        ...this.msalConfig.cache,
      },
    };
  }
}

export default MsalAuthService;
