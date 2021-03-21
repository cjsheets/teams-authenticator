import * as MSAL from '@azure/msal-browser';
import { microsoftTeams } from '../index';
import { IAuthService } from './types';

/*
 * Use ADAL.js and Teams.js library to authenticate against AAD v1
 */
class TeamsAuthService implements IAuthService {
  private authParams: URLSearchParams;

  private authContext: any;

  private loginPromise: Promise<any>;

  constructor() {
    microsoftTeams.initialize();
    microsoftTeams.getContext(function getContext() {});
    const url = new URL(this.window.location.href);
    this.authParams = new URLSearchParams(url.search);
    this.authContext;
  }

  login() {
    if (!this.loginPromise) {
      this.loginPromise = new Promise<any>((resolve, reject) => {
        this.ensureLoginHint().then(() => {
          // Start the login flow
          microsoftTeams.authentication.authenticate({
            url: `${this.window.location.origin}/`,
            width: 600,
            height: 535,
            successCallback: () => {
              resolve(this.getUser());
            },
            failureCallback: (reason) => {
              reject(reason);
            },
          });
        });
      });
    }
    return this.loginPromise;
  }

  logout() {
    return this.authContext.logOut();
  }

  isCallback() {
    return;
  }

  getUser() {
    return new Promise<MSAL.AccountInfo>((resolve, reject) => {
      this.getToken(['email profile User.ReadBasic.All, User.Read.All']).then((token) =>
        resolve(this.parseTokenToUser(token))
      );
    });
  }

  getToken(claims: string[]) {
    return new Promise<string>((resolve, reject) => {
      microsoftTeams.authentication.getAuthToken({
        claims,
        successCallback: (result) => resolve(result),
        failureCallback: (reason) => reject(reason),
      });
    });
  }

  ensureLoginHint() {
    return new Promise((resolve) => {
      resolve(null);
      microsoftTeams.getContext((context) => {
        const scopes = encodeURIComponent(
          'email profile User.ReadBasic.All, User.Read.All, Group.Read.All, Directory.Read.All'
        );

        // Setup extra query parameters for ADAL
        // - openid and profile scope adds profile information to the id_token
        // - login_hint provides the expected user name
        // if (context.loginHint) {
        //   this.authContext.config.extraQueryParameter = `prompt=consent&scope=${scopes}&login_hint=${encodeURIComponent(
        //     context.loginHint
        //   )}`;
        // } else {
        //   this.authContext.config.extraQueryParameter = `prompt=consent&scope=${scopes}`;
        // }
        resolve(null);
      });
    });
  }

  handleLoginRedirect() {
    return null;
  }

  private parseTokenToUser(token: string): MSAL.AccountInfo {
    // parse JWT token to object
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const parsedToken = JSON.parse(this.window.atob(base64));
    const nameParts = parsedToken.name.split(' ');
    return {
      homeAccountId: null,
      localAccountId: null,
      environment: null,
      tenantId: null,
      username: parsedToken.name,
      idTokenClaims: {
        family_name: nameParts.length > 1 ? nameParts[1] : 'n/a',
        given_name: nameParts.length > 0 ? nameParts[0] : 'n/a',
        upn: parsedToken.preferred_username,
        name: parsedToken.name,
      },
    };
  }

  get config() {
    return {} as any;
  }
  //   return {
  //     cacheLocation: 'localStorage' as 'localStorage' | 'sessionStorage',
  //     clientId: process.env.CLIENT_ID,
  //     endpoints: { ...Resource },
  //     extraQueryParameter: '',
  //     instance: 'https://login.microsoftonline.com/',
  //     navigateToLoginRequestUrl: false,
  //     postLogoutRedirectUri: `${this.window.location.origin}/${process.env.ADAL_REDIRECT_PATH}`,
  //     redirectUri: `${this.window.location.origin}/${process.env.ADAL_REDIRECT_PATH}`,
  //     tenant: this.authParams.get('tenantId') || 'common',
  //   };
  // }

  private get window() {
    return window || global;
  }
}

export default TeamsAuthService;
