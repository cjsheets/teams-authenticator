// import MockAuthService from './mock-auth-service';
import { isInsideIframe } from '..';
import MsalAuthService from './msal-auth-service';
import * as MSAL from '@azure/msal-browser';
import TeamsAuthService from './teams-auth-service';
import { IAuthService } from './types';

export default class AuthService implements IAuthService {
  private authService: IAuthService;

  constructor(private msalConfig: MSAL.Configuration, private usePopup = false) {
    this.initAuthService();
  }

  get config() {
    return this.authService.config;
  }

  handleLoginRedirect() {
    return this.authService.handleLoginRedirect();
  }

  login() {
    return this.authService.login();
  }

  logout() {
    return this.authService.logout();
  }

  getToken(scopes: string[]) {
    return this.authService.getToken(scopes);
  }

  getUser() {
    return this.authService.getUser();
  }

  private initAuthService() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    if (params.get('mockData')) {
      //this.authService = new MockAuthService();
    } else if (params.get('isTeamsFrame') || isInsideIframe()) {
      this.authService = new TeamsAuthService();
    } else {
      this.authService = new MsalAuthService(this.msalConfig, this.usePopup);
    }
  }
}
