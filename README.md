# Meetbot 

Meetbot will listen to google meet urls to join to and perform various tasks.

By default since the bot isn't authenticated it will prompt people in the meet to allow the bot to join.

## TO DO 

 - [x] Listen for meeting URLs
 - [ ] Parsing calendar events, find meet URL's and join at designated time. 
 - [x] Join the provided meeting URL's
 - [x] Capture transcribed voice (Only capture the <span> tags, no processing)
   - [ ] figure out how to properly merge updated CCs
 - [ ] Figure out sane authentication flow
 - [x] Send transcribed voice to storage location (Google docs)
 - [x] Perform a voice command

## Development

Just start the service (HTTP server) and post a meet url

```bash
export GOOGLE_LOGIN="hubot@balena.io"
export GOOGLE_PASSWORD="THE PASSWORD from passpack"
export GOOGLE_TOTP_SECRET="THE TOTP SECRET in a separate passpack entry"
npm start
# in another tab
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"url":"https://meet.google.com/wtq-bhai-amg"}' \
  http://localhost:8080/join
```

## Authentication

Orgs require 2FA so automating that isn't easy...there's no API for this as we're leveraging Puppeteer to navigate google meets like a normal user. 

One solution is that we configure the bot to login with email/password (no 2fa) but whatever triggers the POST to this service to get a bot to join can also send a meet invite via an API** which DOES give authorization just for that meet. 

**I don't think there's a public API to do this but from a meet you can invite people via email.
