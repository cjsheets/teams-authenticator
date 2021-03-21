// import MockAuthService from './mock-auth-service';
import { isInsideIframe } from '..';
import MsalAuthService from './msal-auth-service';
// import TeamsAuthService from './teams-auth-service';
// import TeamsSsoAuthService from './teams-sso-auth-service';
import { IAuthService } from './types';

export default class AuthService implements IAuthService {
  private authService: IAuthService;

  constructor() {
    this.initAuthService();
  }

  get config() {
    return this.authService.config;
  }

  handleCallback() {
    return this.authService.handleCallback();
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
      // Teams doesn't allow query parameters for Team scope URIs
      //this.authService = new TeamsAuthService();
    } else if (params.get('isTeamsFrameSSO')) {
      //this.authService = new TeamsSsoAuthService();
    } else {
      this.authService = new MsalAuthService();
    }
  }
}
