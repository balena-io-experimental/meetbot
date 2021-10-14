import { Bot } from '..';
import { promises as fs } from 'fs';
import * as _fs from 'fs';
import * as readline from 'readline';
import { Auth, docs_v1, google } from 'googleapis';
import * as moment from 'moment';
import { postToChatJob } from '../pptr-helpers';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

interface Credentials {
	installed: {
		client_secret: string;
		client_id: string;
		redirect_uris: string;
	};
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @returns with prom that Resolves with the authorized client.
 *
 */
function authorize(credentials: Credentials): Promise<Auth.OAuth2Client> {
	return new Promise<Auth.OAuth2Client>((callback) => {
		/**
		 * Get and store new token after prompting for user authorization, and then
		 * execute the given callback with the authorized OAuth2 client.
		 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
		 * @param {getEventsCallback} callback The callback for the authorized client.
		 */
		function getNewToken(
			authClient: Auth.OAuth2Client,
			cb: (value: Auth.OAuth2Client | PromiseLike<Auth.OAuth2Client>) => void,
		) {
			const authUrl = authClient.generateAuthUrl({
				access_type: 'offline',
				scope: SCOPES,
			});
			console.log('Authorize this app by visiting this url:', authUrl);
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});
			rl.question('Enter the code from that page here: ', (code) => {
				rl.close();
				authClient.getToken(code, (err, token) => {
					if (err || !token) {
						return console.error('Error retrieving access token', err, token);
					}
					authClient.setCredentials(token);
					// Store the token to disk for later program executions
					_fs.writeFile(TOKEN_PATH, JSON.stringify(token), (e) => {
						if (e) {
							console.error(e);
						}
						console.log('Token stored to', TOKEN_PATH);
					});
					cb(authClient);
				});
			});
		}

		const { client_secret, client_id, redirect_uris } = credentials.installed;

		const oAuth2Client = new google.auth.OAuth2(
			client_id,
			client_secret,
			redirect_uris[0],
		);

		// Check if we have previously stored a token.
		_fs.readFile(TOKEN_PATH, (err, token: any) => {
			if (err) {
				return getNewToken(oAuth2Client, callback);
			}
			oAuth2Client.setCredentials(JSON.parse(token));
			callback(oAuth2Client);
		});
	});
}

let cursor = 1;
export async function createNewTranscriptDoc(
	auth: Auth.OAuth2Client,
	title = `Transcript for Meeting ${new Date().toISOString()}`,
): Promise<string> {
	const client = google.docs({ version: 'v1', auth });

	const createResponse = await client.documents.create({
		requestBody: { title },
	});

	const documentId = (createResponse?.data?.documentId as string).trim();

	if (!documentId) {
		throw Error('Could not create new Transcript Document');
	}

	console.log(
		`Transcript is available at \nhttps://docs.google.com/document/d/${documentId}/edit`,
	);

	const text = `Transcript\n`;
	const emptyLine = '\n';
	const textStartIndex = Math.max(1, cursor);

	const textEndIndex = textStartIndex + text.length - 1; //
	// console.log("textStartIndex", textStartIndex, "textEndIndex", textEndIndex)
	cursor = textEndIndex + textStartIndex + 1;
	// console.log("cursor", cursor)
	await client.documents.batchUpdate({
		documentId,
		requestBody: {
			requests: [
				{
					insertText: {
						endOfSegmentLocation: {},
						text,
					},
				},
				{
					updateTextStyle: {
						textStyle: {
							bold: true,
							weightedFontFamily: { fontFamily: 'Cambria' },
							fontSize: { magnitude: 18, unit: 'PT' },
						},
						fields: 'bold,weightedFontFamily,fontSize',
						range: {
							startIndex: textStartIndex,
							endIndex: textEndIndex,
						},
					},
				},
				{
					insertText: {
						endOfSegmentLocation: {},
						text: emptyLine,
					},
				},
			],
		},
	});
	return documentId;
}

function makeDocOps({
	startedAt,
	person,
	image,
	text,
}: SteganographerEvent): docs_v1.Schema$Request[] {
	const heading = `${moment(startedAt).format('h:mm:ss a UTC')} - ${person}:\n`;
	const IMG_LENGTH = 1;
	const message = `${text}\n\n`;

	const headerStartIndex = Math.max(1, cursor);
	const headerEndIndex = headerStartIndex + heading.length - 1;
	cursor = headerEndIndex + IMG_LENGTH + 1;

	const messageStartIndex = Math.max(1, cursor);
	const messageEndIndex = messageStartIndex + message.length;
	cursor = messageEndIndex;

	return [
		{
			insertText: {
				endOfSegmentLocation: {},
				text: heading,
			},
		},
		{
			updateTextStyle: {
				textStyle: {
					bold: true,
					weightedFontFamily: { fontFamily: 'Cambria' },
					foregroundColor: {
						color: {
							rgbColor: {
								red: 111 / 255,
								blue: 111 / 255,
								green: 111 / 255,
							},
						},
					},
				},
				fields: 'bold,weightedFontFamily,foregroundColor',
				range: {
					startIndex: headerStartIndex,
					endIndex: headerEndIndex,
				},
			},
		},
		{
			insertInlineImage: {
				endOfSegmentLocation: {},
				uri: image,
				objectSize: {
					height: { magnitude: 11, unit: 'PT' },
					width: { magnitude: 11, unit: 'PT' },
				},
			},
		},
		{
			insertText: {
				endOfSegmentLocation: {},
				text: message,
			},
		},
		{
			updateTextStyle: {
				textStyle: {
					weightedFontFamily: { fontFamily: 'Cambria' },
				},
				fields: '*',
				range: {
					startIndex: messageStartIndex,
					endIndex: messageEndIndex,
				},
			},
		},
	];
}

export async function appendToTranscriptDoc(
	auth: Auth.OAuth2Client,
	documentId: string,
	caption: SteganographerEvent,
) {
	const client = google.docs({ version: 'v1', auth });

	return client.documents.batchUpdate({
		documentId,
		requestBody: {
			requests: [...makeDocOps(caption)],
		},
	});
}

////////////////////////////////////////

export const attach = async (bot: Bot) => {
	// Load client secrets from a local file.
	let content = '';
	try {
		content = (await fs.readFile('credentials.json')).toString();
	} catch (err) {
		console.warn(
			'deactivating streaming integration because of missing credentials.json file',
		);
		return;
	}

	console.log('Running streaming feature..');

	let documentId: string;
	let auth: Auth.OAuth2Client;
	let documentUrl: string;
	bot.on('joined', async (joined) => {
		const id = joined.meetURL.split('/').pop();

		auth = await authorize(JSON.parse(content) as Credentials);
		documentId = await createNewTranscriptDoc(
			auth,
			`Transcript ${id} (${moment().format('YYYY-MM-DD at HH:MM G[M]TZ')})`,
		);
		documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

		bot.emit('transcript_doc_ready', {
			transcriptUrl: documentUrl,
			meetURL: joined.meetURL,
		});
		bot.addJob(
			postToChatJob(
				`Hey team, you can find the transcript for this call here: ${documentUrl}`,
			),
		);
	});

	bot.on('caption', async (data: CaptionEvent) => {
		if (!documentId || !auth) {
			console.error(
				`Either Document ID \`${documentId}\` or OAuth2 Client \`${auth}\` not provided`,
			);
			return;
		}

		if (
			!data.caption ||
			!data.caption.text.trim() ||
			!data.caption.startedAt ||
			!data.caption.person ||
			data.caption.person.trim().toLowerCase() === 'Meeting host'.toLowerCase()
		) {
			return;
		}

		bot.addJob(async () => {
			await appendToTranscriptDoc(auth, documentId, data.caption);
		});
	});
};
