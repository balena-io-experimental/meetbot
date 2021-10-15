import * as fs from 'fs';
import * as readline from 'readline';
import { Auth, docs_v1, google } from 'googleapis';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

interface DocEntry {
	timestamp: string;
	author: string;
	text: string;
}

export interface Credentials {
	client_secret: string;
	client_id: string;
	redirect_uris: string;
}

export class GoogleDoc {
	private auth: Auth.OAuth2Client;
	private cursor: number = 1;

	constructor(credentials: Credentials) {
		this.auth = new google.auth.OAuth2(
			credentials.client_id,
			credentials.client_secret,
			credentials.redirect_uris[0],
		);
		try {
			const token = fs.readFileSync(TOKEN_PATH, {
				encoding: 'utf8',
				flag: 'r',
			});
			this.auth.setCredentials(JSON.parse(token));
		} catch (error) {
			this.getNewToken();
		}
	}

	private getNewToken() {
		const authUrl = this.auth.generateAuthUrl({
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
			this.auth.getToken(code, (err, token) => {
				if (err || !token) {
					return console.error('Error retrieving access token', err, token);
				}
				fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
				this.auth.setCredentials(token);
			});
		});
	}

	async create(docName: string): Promise<string> {
		const client = google.docs({ version: 'v1', auth: this.auth });

		const createResponse = await client.documents.create({
			requestBody: { title: docName },
		});

		const documentId = (createResponse?.data?.documentId as string).trim();

		if (!documentId) {
			throw Error('Could not create new document');
		}

		console.log(
			`Document is available at \nhttps://docs.google.com/document/d/${documentId}`,
		);

		const text = 'Chat Messages\n';
		const emptyLine = '\n';
		const textStartIndex = Math.max(1, this.cursor);

		const textEndIndex = textStartIndex + text.length - 1;
		this.cursor = textEndIndex + textStartIndex + 1;
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

	public async addEntry(
		documentId: string,
		{ timestamp, author, text }: DocEntry,
	) {
		const client = google.docs({ version: 'v1', auth: this.auth });

		return client.documents.batchUpdate({
			documentId,
			requestBody: {
				requests: [...this.formatEntry({ timestamp, author, text })],
			},
		});
	}

	private formatEntry({
		timestamp,
		author,
		text,
	}: DocEntry): docs_v1.Schema$Request[] {
		const heading = `${new Date(+timestamp).toISOString()} - ${author}:\n`;
		const message = `${text}\n\n`;

		const headerStartIndex = Math.max(1, this.cursor);
		const headerEndIndex = headerStartIndex + heading.length - 1;
		this.cursor = headerEndIndex + 1;

		const messageStartIndex = Math.max(1, this.cursor);
		const messageEndIndex = messageStartIndex + message.length;
		this.cursor = messageEndIndex;

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
}
