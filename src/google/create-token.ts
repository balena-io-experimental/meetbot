import fs = require('fs');
import readline = require('readline');
import { Auth, google } from 'googleapis';

// If modifying these scopes, delete token.json. Create a fresh one. At the moment, we only use the Google Docs API, hence the scope is for documents only.
const SCOPES = ['https://www.googleapis.com/auth/documents'];
const TOKEN_PATH = process.env.TOKEN_PATH || 'token.json';

// Scopes with the calendar included will become:
// const SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/calendar.readonly'];

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @remark The file token.json stores the user's access and refresh tokens, and is
 * created automatically when the authorization flow completes for the first time.
 */
export async function getNewToken() {
	try {
		const credentialsFile = fs.readFileSync('credentials.json').toString();
		const credentials = JSON.parse(credentialsFile).installed;
		const auth: Auth.OAuth2Client = new google.auth.OAuth2(
			credentials.client_id,
			credentials.client_secret,
			credentials.redirect_uris[0],
		);
		const authUrl = auth.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES,
		});
		console.log(
			'This script will create a token.json file for you to authenticate Google APIs \n',
		);
		console.log('Authorize this app by visiting this url:', authUrl);
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question('Enter the code from that page here: ', (code: string) => {
			rl.close();
			auth.getToken(code, (err, token) => {
				if (err || !token) {
					return console.error('Error retrieving access token', err, token);
				}
				fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
				auth.setCredentials(token);
			});
		});
	} catch (err) {
		console.log(
			'Cannot read credentials.json - required to authenticate Google API',
			err,
		);
	}
}

// getNewToken();
