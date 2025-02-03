const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN,
});

oauth2Client.refreshAccessToken((err, tokens) => {
  if (err) {
    console.error('Error refreshing access token:', err);
  } else {
    console.log('New access token:', tokens.access_token);
  }
});
