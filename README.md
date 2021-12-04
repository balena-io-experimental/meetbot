# Meetbot 

Meetbot is a Google Meet bot that makes meetings frictionless. 

Meetbot aims to eliminate questions in video calls like:

_1. Can you hear me? Can you hear us?_ Validates audio input of attendees minus the awkward silence.
_2. Can you resend those links again?_ Meetbot records chat transcript.
_3. Do you have any notes from the call?_ Also, records voice caption transcript.
_4. Was the meeting recorded?_ Auto-records meetings. 
_5. Does anyone have the links shared in the meeting?_ Saves it all to Google Docs. Easy sharing.

And, many more features.

![](img/diagram.drawio.png)

## Try it out!

Running this project is as simple as deploying it to a balenaCloud application. You can do it in just one click by using the button below:

[![balena deploy button](https://www.balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io-playground/meetbot)

### Configuration

By default, meetbot will join meetings as an unauthenticated user and won't be able to perform some features. To enable all features, follow the [authentication instructions](#authentication). 

| Environment Variable | Description                                                                                                 | Default value                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| GOOGLE_PASSWORD      | Password of the Google account meetbot uses for running [authenticated features](#authentication).          | NA                                                  |
| GOOGLE_EMAIL         | Email address of the Google account meetbot uses for for running [authenticated features](#authentication). | NA                                                  |
| GOOGLE_TOTP_SECRET   | If the Google account has 2FA security, then the TOTP secret that is configured for 2FA goes here.          | NA                                                  |
| HTTP_PORT            | Port on which the meetbot server starts running. For balena devices, the server needs to run on port 80.    | 8080                                                |
| MAX_BOTS             | Maximum number of meetbots to run parallely on the server                                                   | 5                                                   |
| GREETING_MESSAGE     | Greeting message which is posted when meetbot joins the Google Meet                                         | "Hello balenistas, it's your favorite bot, meetbot" |

## Getting Started

After getting the bot server [up and running](#deployment), it will start listening for requests to provision new meetbots. 

To get a meetbot in your meeting, navigate to the Meetbot dashboard using the [public device URL](https://www.balena.io/docs/learn/manage/actions/#enable-public-device-url) or the port you configured for the server to run on. 

Click the "Join Meeting" button and enter the Google Meet URL in the text box. Click "Join Meeting" and wait for a few seconds for the bot to join. When the bot joins the meeting or prompts to join the meeting, it will post a message to the chat to signal that's it's ready to go.

### Running the bot locally

After cloning the repository, install the dependencies:

```
npm ci
npm start
```

The bot will now be running but functionality is limited until the bot is [authenticated](#authentication). To get a bot to join a Google Meet, head to the Meetbot dashboard available on `http://localhost:8080` and click the `Join` button. Copy the Google Meet URL and paste it into the text field.


## Authentication

Authentication is needed to:

1. Record meetings
2. Creating Google Docs to save transcripts
3. Checking the calendar to join meetings automatically
4. Joining the Google Meet automatically without the "Allow User" prompt

Finally, for integrations with Google docs and calendar you must download the credentials file containing data for oauth2 flow. This is used to authenticate requests to the Google API. See the following docs to create the credentials needed:

- Step 1: https://developers.google.com/workspace/guides/create-project
- Step 2: Setup your Oauth consent screen as mandated by Google: https://developers.google.com/workspace/guides/create-credentials#configure_the_oauth_consent_screen
- Step 3: https://developers.google.com/workspace/guides/create-credentials#desktop
- Step 4: At the end of the process, download the JSON file and place it at the root of the project directory with name as "credentials.json".

Troubleshooting: https://stackoverflow.com/questions/58460476/where-to-find-credentials-json-for-google-api-client

After following the steps, run the command below and follow the instructions to generate a `token.json` file. This authentication process is one time only and after this the token.json file will be used for any further authentication process. 

```
ts-node src/google/create-token.ts
```

## Development

To add new features to the bot. Fork the repository and add your feature to `src/meetbot/features`. After finishing your changes, [run the bot locally](#running-the-bot-locally) to check if your feature loads and test your changes. 

To develop the UI, run `npm run dev-ui`. This will spin up the development server. You should then be able to access the dashboard at `http://localhost:3000/`. Note that the data you will see on the tables are actually being mocked by MirageJS, and not actual request is going to the API. This makes it easier to develop both components in an entirely decoupled way.

## Deployment

To activate all the features of meetbot, [authenticate the meetbot](#authentication) and create the `token.json` file before deployment. 

To deploy on balenaCloud, use the balena CLI and balena push command as stated below. For more information [check out the docs](https://www.balena.io/docs/learn/deploy/deployment/).

```
balena push <Name of fleet>
```

To deploy on a server, create and fill the `.env` file in the root of the project directory using the `.env.example` file and deploy using the Dockerfile present in the root directory of this repository. 

## Credits

Meetbot's google meet voice caption capture is implemented using [dzaman/google-meet](https://github.com/dzaman/google-meet-transcripts)'s stenographer implementation licensed under GNU GPLv3.
