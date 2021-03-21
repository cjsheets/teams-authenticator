import * as MSAL from '@azure/msal-browser';

export interface IAuthService {
  config: MSAL.Configuration;
  getToken(scopes: string[]): Promise<string>;
  login(): Promise<MSAL.AuthenticationResult | void>;
  logout(): Promise<void>;
  getUser(): Promise<MSAL.AccountInfo>;
  handleLoginRedirect(): Promise<MSAL.AuthenticationResult>;
}

export enum Resource {
  graph = 'https://graph.microsoft.com/',
}

export interface MsalOptions {
  auth: {
    clientId: string;
    redirectUri: string;
  };
}
