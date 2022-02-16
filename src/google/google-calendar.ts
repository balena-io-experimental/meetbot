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
	async listEvents(calendarName: string): Promise<DataPacket[]> {
		this.calendar = google.calendar({ version: 'v3', auth: this.auth });
		const events: any = await this.calendar.events.list({
			calendarId: `${calendarName}`,
			timeMin: new Date().toISOString(),
			maxResults: 15,
			singleEvents: true,
			orderBy: 'startTime',
		});

		return events.data.items
			.filter(
				(item: any) =>
					item.hangoutLink.includes('meet.google.com') &&
					item.status === 'confirmed',
			)
			.map((event: any) => {
				{
					return {
						name: event.summary,
						startTime: event.start.dateTime,
						endTime: event.end.dateTime,
						meetUrl: event.hangoutLink,
						eventUrl: event.htmlLink,
					};
				}
			});
	}
}
