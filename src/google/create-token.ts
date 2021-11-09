import { getNewToken } from './token-generator';
import * as fs from 'fs';
import { google } from 'googleapis';

try {
	const credentialsFile = fs.readFileSync('credentials.json').toString();
	const credentials = JSON.parse(credentialsFile).installed;
	if (!credentials) {
		throw new Error(
			'The credentials.json file was not found. Follow the instructions in README.',
		);
	}
	const auth = new google.auth.OAuth2(
		credentials.client_id,
		credentials.client_secret,
		credentials.redirect_uris[0],
	);
	getNewToken(auth);
} catch (err) {
	console.log('Cannot create token.json', err);
}
