import * as fs from 'fs';
import { Auth, google, calendar_v3 } from 'googleapis';
import { getNewToken } from './token-generator';

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = process.env.TOKEN_PATH || 'token.json';

export interface Credentials {
	client_secret: string;
	client_id: string;
	redirect_uris: string;
}

export interface DataPacket {
	name: string;
	startTime: string;
	endTime: string;
	meetUrl: string;
	eventUrl: string;
}

export class GoogleCalendar {
	private auth: Auth.OAuth2Client;
	private calendar: calendar_v3.Calendar | undefined;

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
			getNewToken(this.auth);
		}
	}

	/**
	 * Fetches all calendar events from the admin calendar.
	 *
	 * @param calendarID The calendar ID to fetch events from.
	 */
	async listEvents(calendarName: string | undefined): Promise<DataPacket[]> {
		this.calendar = google.calendar({ version: 'v3', auth: this.auth });
		// Need help with Google types, they are making me crazy
		// const events: GaxiosResponse<calendar_v3.Schema$Event> =  await this.calendar.events.list({
		const events: any = await this.calendar.events.list({
			calendarId: `${calendarName}`,
			timeMin: new Date().toISOString(),
			maxResults: 15,
			singleEvents: true,
			orderBy: 'startTime',
		});

		if (events.data.items.length) {
			return events.data.items
				.map((event: any) => {
					if (
						event.hangoutLink.includes('meet.google.com') &&
						event.status === 'confirmed'
					) {
						return {
							name: event.summary,
							startTime: event.start.dateTime,
							endTime: event.end.dateTime,
							meetUrl: event.hangoutLink,
							eventUrl: event.htmlLink,
						};
					}
				})
				.filter((item: DataPacket) => item !== undefined);
		} else {
			return [];
			// Do nothing
		}
	}
}
