import fs = require('fs');
import readline = require('readline');
import { Auth } from 'googleapis';
import { resolve } from 'path';

// If modifying these scopes, delete token.json. Create a fresh one.
const SCOPES = [
	'https://www.googleapis.com/auth/documents',
	'https://www.googleapis.com/auth/calendar.readonly',
];
const TOKEN_PATH = resolve('token.json');

// Scopes with the calendar included will become:
// const SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/calendar.readonly'];

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @remark The file token.json stores the user's access and refresh tokens, and is
 * created automatically when the authorization flow completes for the first time.
 *
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
export async function getNewToken(auth: Auth.OAuth2Client) {
	try {
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
		console.log('Cannot create token.json file: ', err);
	}
}
