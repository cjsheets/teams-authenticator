# Teams Authenticator

Common interface to authenticate inside and outside of Microsoft Teams.

- Inside Teams: [SDK.authentication.authenticate()](https://docs.microsoft.com/en-us/javascript/api/@microsoft/teams-js/authentication?view=msteams-client-js-latest)

- Outside Teams: [MSAL v2 (@azure/msal-browser)](https://www.npmjs.com/package/@azure/msal-browser)

Includes a mock implementation (for testing!) and exports [@microsoft/teams-js](https://www.npmjs.com/package/@microsoft/teams-js) so you can avoid bundling copies of the SDK.

## Getting Started

Using MSAL for authentication requires the [registration of an SPA](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration). Follow the MSAL.js 2.0 with auth code flow.

After registering your app you need to configure environment variables for your client. See [this tutorial](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration). Specifically, you need to define:

- CLIENT_ID
- MSAL_REDIRECT_PATH

// https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/2934

### Logging In

If you're inside an iframe the Teams SDK will be used to acquire tokens. You're responsible for calling microsoftTeams.initialize() beforehand.

```
import { isInsideIframe, microsoftTeams, TeamsAuthenticator } from 'teams-authenticator';


if (isInsideIframe()) {
  microsoftTeams.initialize();
}

const authenticator = new TeamsAuthenticator({
  auth: {
    clientId: <your-client-id>,
  },
});

authenticator.login();
```
