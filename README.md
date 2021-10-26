# Meetbot 

Meetbot will listen to google meet urls to join to and perform various tasks.

By default since the bot isn't authenticated it will prompt people in the meet to allow the bot to join.

## Setup

After cloning the repository install the dependencies:

```
npm ci
```

## Running the bot 

```
npm start
```

The bot will now be running but functionality is limited until you add additional configurations for [authentication](#authentication).

To get a bot to join a meet send a POST request to the join endpoint with the meet url like:

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"url":"https://meet.google.com/wtq-bhai-amg"}' \
  http://localhost:8080/join
```

## Authentication

Copy `.env.example` to `.env` and populate it with the correct information. This is used by the bot to login to accounts.google.com.

Finally, for integrations with Google docs and calendar you must create a credentials file called `token.json` containing data for oauth2 flow. See the following docs:

 - https://developers.google.com/workspace/guides/create-project
 - https://developers.google.com/workspace/guides/create-credentials#desktop
 - https://stackoverflow.com/questions/58460476/where-to-find-credentials-json-for-google-api-client

