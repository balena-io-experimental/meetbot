# Meetbot 

Meetbot joins your Google Meet meetings to help reduce friction and helps you eliminate the need for everyday questions like: 

_1. Can you resend those links again?_ Meetbot records chat transcript.
_2. Do you have notes the call?_ Also, records voice captions/transcript.
_3. Was the meeting recorded?_ Auto-records meetings. 
_4. Can you hear me? ... Can you hear us?_ Validates audio input of attendees minus the awkward silence.
_5. Does anyone have the links shared in the meeting?_ Saves it all to Google Docs

And, many more features.

![](img/diagram.drawio.png)

## Try it out!

[![balena deploy button](https://www.balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io-playground/meetbot)

By default, meetbot will function and joins meetings as an unauthenticated user. Follow the [authentication instrucitons](#authentication) below to enable all the features. 

## Development

To add new features to the bot. Fork the repository and add your feature to `src/meetbot/features`. After finishing your changes, [run the bot locally](#running-the-bot-locally) to check if your feature loads and test your changes. 

To develop the UI, run `npm run dev-ui`. This will spin up the development server. You should then be able to access the dashboard at `http://localhost:3000/`. Note that the data you will see on the tables are actually being mocked by MirageJS, and not actual request is going to the API. This makes it easier to develop both components in an entirely decoupled way.

A meetbot should request to join the Google Meet.

### Running the bot locally

After cloning the repository, install the dependencies:

```
npm ci
npm start
```

The bot will now be running but functionality is limited until the bot is [authenticated](#authentication). To get a bot to join a Google Meet, head to the Meetbot dashboard available on `http://localhost:8080` and click the `Join` button. Copy the Google Meet URL and paste it into the text field.


## Authentication

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

## Deployment

To activate all the features of meetbot, [authenticate the meetbot](#authentication) and create the `token.json` file before deployment.

To deploy a new release on balenaCloud, run the command below:

```
balena push <Name of fleet>
```
