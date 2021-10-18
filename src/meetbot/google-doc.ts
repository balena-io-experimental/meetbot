import * as fs from 'fs';
import * as readline from 'readline';
import { Auth, docs_v1, google } from 'googleapis';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

export interface Credentials {
	client_secret: string;
	client_id: string;
	redirect_uris: string;
}

export class GoogleDoc {
	private auth: Auth.OAuth2Client;
	private cursor: number = 1;
	private messageQueue: docs_v1.Schema$Request[][] = [];
	private timer: NodeJS.Timeout | null = null;
	private client: any;
	protected documentId: string = '';

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
		this.client = google.docs({ version: 'v1', auth: this.auth });

		const createResponse = await this.client.documents.create({
			requestBody: { title: docName },
		});

		this.documentId = (createResponse?.data?.documentId as string).trim();

		if (!this.documentId) {
			throw Error('Could not create new document');
		}

		console.log(
			`${docName} is available at \nhttps://docs.google.com/document/d/${this.documentId}`,
		);
		this.runQueue();
		return this.documentId;
	}
	private formatTextEntry(text: string) {
		return {
			insertText: {
				endOfSegmentLocation: {},
				text,
			},
		};
	}
	public addTitle(text: string) {
		const startIndex = Math.max(1, this.cursor);
		const endIndex = startIndex + text.length - 1;
		this.cursor = endIndex + startIndex;
		this.messageQueue.push([
			this.formatTextEntry(text),
			{
				updateTextStyle: {
					textStyle: {
						bold: true,
						weightedFontFamily: { fontFamily: 'Cambria' },
						fontSize: { magnitude: 18, unit: 'PT' },
					},
					fields: 'bold,weightedFontFamily,fontSize',
					range: { startIndex, endIndex },
				},
			},
		]);
	}

	public addHeading(text: string) {
		const startIndex = Math.max(1, this.cursor);
		const endIndex = startIndex + text.length - 1;
		this.cursor = endIndex + 1;
		this.messageQueue.push([
			this.formatTextEntry(text),
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
					range: { startIndex, endIndex },
				},
			},
		]);
	}
	public addText(text: string) {
		const startIndex = Math.max(1, this.cursor);
		const endIndex = startIndex + text.length - 1;
		this.cursor = endIndex + 1;
		this.messageQueue.push([
			this.formatTextEntry(text),
			{
				updateTextStyle: {
					textStyle: {
						weightedFontFamily: { fontFamily: 'Cambria' },
					},
					fields: '*',
					range: { startIndex, endIndex },
				},
			},
		]);
	}
	public addImage(uri: string) {
		this.cursor += 1;
		this.messageQueue.push([
			{
				insertInlineImage: {
					endOfSegmentLocation: {},
					uri,
					objectSize: {
						height: { magnitude: 11, unit: 'PT' },
						width: { magnitude: 11, unit: 'PT' },
					},
				},
			},
		]);
	}

	private runQueue() {
		if (this.timer) {
			clearTimeout(this.timer);
		}
		this.timer = setTimeout(async () => {
			if (this.messageQueue.length) {
				const message = this.messageQueue.shift();
				await this.client.documents.batchUpdate({
					documentId: this.documentId,
					requestBody: {
						requests: message,
					},
				});
			}
			this.runQueue();
		}, 1000);
	}
}
