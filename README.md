# Meetbot 

Meetbot is a Google Meet bot that makes your meetings frictionless. Features include eliminating questions in video calls like:

1. _Can you hear me? Can you hear us?_ Validates audio input of attendees minus the awkward silence.
2. _Can you resend those links again?_ Meetbot records chat transcript.
3. _Do you have any notes from the call?_ Also, records voice caption transcript.
4. _Was the meeting recorded?_ Auto-records meetings.
5. _Does anyone have the links shared in the meeting?_ Saves it all to Google Docs. Easy sharing.

And, many more features.

![](img/diagram.drawio.png)

## Try it out!

To deploy this project on balenaCloud, use the button below.

[![balena deploy button](https://www.balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io-playground/meetbot)

### Configuration

By default, meetbot will join meetings as an unauthenticated user and won't be able to perform some features. To enable all features, follow the [authentication instructions](#authentication). 

| Environment Variable | Description                                                                                                        | Default value                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| GOOGLE_PASSWORD      | Password of the Google account meetbot uses for running [authenticated features](#authentication)                  | NA                                             |
| GOOGLE_EMAIL         | Email address of the Google account meetbot uses for for running [authenticated features](#authentication)         | NA                                             |
| GOOGLE_TOTP_SECRET   | If the Google account has 2FA security, then the TOTP secret that is configured for 2FA goes here                  | NA                                             |
| HTTP_PORT            | (Optional) Port on which the meetbot server starts running. For balena devices, the server needs to run on port 80 | 80                                             |
| MAX_BOTS             | (Optional) Maximum number of meetbots to run parallely on the server                                               | 5                                              |
| GREETING_MESSAGE     | (Optional) Greeting message which is posted when meetbot joins the Google Meet                                     | "Hello folks, it's your favorite bot, hubot!!" |

Read more about [variables](https://www.balena.io/docs/learn/manage/variables/) in balenaCloud Dashboard. 

## Getting Started

After getting the bot server [up and running](#deployment), it will start listening for requests to provision new meetbots. 

To get a meetbot to join your meeting, navigate to the Meetbot dashboard using the [public device URL](https://www.balena.io/docs/learn/manage/actions/#enable-public-device-url) or the port you configured for the server to run on. 

Click the "Join" button and enter the Google Meet URL in the modal that opens. Click the "Join meeting" button and wait for a few seconds for the bot to join the meeting. When the bot joins, it will post the configured greeting message on the Google Meet chat. This means, the meetbot is ready to go!

### Running the bot locally

After cloning the repository, install the dependencies:

```
npm ci
HTTP_PORT=8080 npm start
```

The bot will now be running but functionality is limited until the bot is [authenticated](#authentication). To get a bot to join a Google Meet, head to the Meetbot dashboard available on `http://localhost:8080` and click the `Join` button.

## Development

Meetbot is based on a plugin event driven architecture. Most features work independently either creating events or using events to perform a specific function. To add new features to meetbot, start by adding it in `src/meetbot/features`. Check out other features for help in understanding how things work. After finishing your changes, [run the bot locally](#running-the-bot-locally) to check if your feature loads and test your changes. 

To develop the UI, run `npm run dev-ui`. This will spin up the development server. You should then be able to access the dashboard at `http://localhost:3000/`. Note that the data you will see on the tables is only mocked and no actual requests are sent to the API. This makes it easier to develop the UI independently.

## Authentication

Authentication for meetbot is 3 phased and crucial to run the following features:

1. Record meetings
2. Create Google Docs to save transcripts
3. Join Google Meet automatically without the "Allow User" prompt
4. (Optional) Check the Google calendar to join meetings automatically

In unauthenticated mode, the bot will only be able to join meetings as an unverified user and performs limited functionality. To verify and join a Google meet as a user, the meetbot will need login credentials to a Google account (`GOOGLE_EMAIL` and `GOOGLE_PASSWORD`). If the Google account has 2FA security enabled, then the TOTP secret that is configured for 2FA would also be required (`GOOGLE_TOTP_SECRET`). This will help the bot join the Google meet as a user.

Since, recording meetings is not a free feature available outside of the Gsuite organization. The meetbot user being created preferrably should be a member of the Gsuite organization. This will also allow meetbot to join meetings automatically without the "Allow User" prompt.

Finally, for integrations with Google docs and calendar you must download the credentials file containing data for oauth2 flow. This is used to authenticate requests to the Google API. See the following steps to create the credentials needed or [watch this video](https://www.youtube.com/watch?v=vt_PtZ6KYIE).

- Step 1: Create a new project https://developers.google.com/workspace/guides/create-project
- Step 2: Setup your Oauth consent screen as mandated by Google: https://developers.google.com/workspace/guides/create-credentials#configure_the_oauth_consent_screen
- Step 3: https://developers.google.com/workspace/guides/create-credentials#desktop
- Step 4: At the end of the process, download the JSON file and place it at the root of the project directory with file name as `credentials.json`.

Troubleshooting: https://stackoverflow.com/questions/58460476/where-to-find-credentials-json-for-google-api-client

After following the steps, run the command below and follow the instructions to generate a `token.json` file. This authentication process is one time only and after this the token.json file will be used for any further authentication process. 

```
ts-node src/google/create-token.ts
```

## Deployment

To activate all the features of meetbot, [authenticate the meetbot](#authentication) and create the `token.json` file before deployment. 

To deploy to your device with the help of [balenaCloud](https://www.balena.io/cloud/), use [balena CLI](https://github.com/balena-io/balena-cli/blob/master/INSTALL.md)'s `balena push` command as stated below. For more information check out the [balena docs](https://www.balena.io/docs/learn/deploy/deployment/).

```
balena push <Name of fleet>
```

## Credits

Meetbot is free software, and may be redistributed under the terms specified in the [license](./LICENSE).
