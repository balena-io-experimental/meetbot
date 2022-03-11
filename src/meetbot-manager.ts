import { Browser } from 'puppeteer';
import { URL } from 'url';
import * as fs from 'fs';

import MeetBot from './meetbot';
import { newBrowser } from './browser';
import { all as allFeatures } from './meetbot/features';
import {
	GoogleCalendar,
	Credentials,
	DataPacket,
} from './google/google-calendar';

const MAX_BOTS = process.env.MAX_BOTS || 5;
const Bots = new Map<string, MeetBot>();

// Time between intervals to check for new events using Google Calendar API
const CALENDAR_POLLING_INTERVAL = parseInt(
	process.env.CALENDAR_POLLING_INTERVAL || `${60000}`, // Value needs to be in milliseconds
	10,
);

// Time between intervals to parse the schedule and spawn bots when the time comes
const SCHEDULE_PARSING_INTERVAL = parseInt(
	process.env.SCHEDULE_PARSING_INTERVAL || `${1500}`, // Value needs to be in milliseconds
	10,
);

type MeetBotListItem = {
	url: string | null;
	transcriptUrl: string | null;
	chatTranscriptUrl: string | null;
	joinedAt: string | null;
	leftAt: string | null;
};

let browser: Browser | null = null;

export async function init(): Promise<void> {
	if (browser === null) {
		browser = await newBrowser();
	}
	await scheduleBotsForMeetings();
}

export async function listBots() {
	const results: MeetBotListItem[] = [];

	Bots.forEach((value: MeetBot, _key: string) => {
		results.push({
			url: value.url,
			transcriptUrl: value.transcriptUrl,
			chatTranscriptUrl: value.chatTranscriptUrl,
			joinedAt: value.joinedAt,
			leftAt: value.leftAt,
		});
	});

	return results;
}

export async function spawnBot(url: string) {
	const meetURL = new URL(url);

	if (meetURL.hostname !== 'meet.google.com') {
		throw new Error('Invalid Google Meet URL.');
	} else if (Bots.size >= MAX_BOTS) {
		throw new Error(`Maximum bot queue reached!`);
	} else if (Bots.has(url)) {
		throw new Error(`A bot is already in that location!`);
	} else if (browser === null) {
		throw new Error('Browser instance has not been initialized!');
	}

	// Create a new bot instance with the already created browser instance
	const bot = new MeetBot(url, browser, allFeatures);
	Bots.set(url, bot);

	// Initialize bot (opens a new page)
	await bot.init();

	bot.on('joined', () => {
		Bots.set(url, bot);
		console.log(`Current bot queue size: ${Bots.size}`);
	});

	bot.on('transcript_doc_ready', (data) => {
		bot.transcriptUrl = data.transcriptUrl;
	});

	bot.on('chat_transcript_doc_ready', (data) => {
		bot.chatTranscriptUrl = data.transcriptUrl;
	});

	bot.on('left', () => {
		// nothing to do when a bot leaves
	});

	bot.on('error', (err) => {
		console.error('Unrecoverable bot error occured:', err.message);
		if (Bots.get(bot.url)) {
			console.log(`Removing ${bot.url} from active bot queue`);
			Bots.delete(bot.url);
		}
	});

	// Tell bot to start running
	bot.joinMeet();
}

export async function killBot(url: string) {
	const bot = Bots.get(url);
	if (bot) {
		console.log(`Killing bot for ${url}`);
		bot.leaveMeet();
	} else {
		throw new Error(`Could not find bot at specified location!`);
	}
}

export async function scheduleBotsForMeetings() {
	let credentials: Credentials | null = null;
	try {
		const credentialsFile = fs.readFileSync('credentials.json').toString();
		credentials = JSON.parse(credentialsFile).installed;
	} catch (err) {
		console.log(
			'Cannot read credentials.json - required to use Google Calendar',
			err,
		);
	}

	if (!credentials || !process.env.GOOGLE_CALENDAR_NAME) {
		console.log(
			'deactivating google calender feature due to missing credentials/calendar name',
		);
		return;
	}
	const calendarName: string = process.env.GOOGLE_CALENDAR_NAME as string;
	const calendar = new GoogleCalendar(credentials);
	let meetingSchedule: DataPacket[] = await calendar.listEvents(calendarName);
	console.log(`Start Meeting Scheduler${
		meetingSchedule.length
			? `: Tracking ${meetingSchedule.length}+ meetings`
			: `: (No meetings found on ${calendarName})`
	}
	`);

	// Check for events on the calendar and refresh schedule
	setInterval(async () => {
		meetingSchedule = await calendar.listEvents(calendarName);
	}, CALENDAR_POLLING_INTERVAL);

	// Checking the meeting schedule and spawn bots when the time comes
	if (meetingSchedule.length) {
		setInterval(async () => {
			for (const meeting of meetingSchedule) {
				// Add 60 seconds to delay meetbot spawn
				if (
					new Date(meeting.startTime).getTime() + 60000 <=
					new Date().getTime()
				) {
					if (Bots.get(meeting.meetUrl)) {
						// Add rejoin mechanism here if meetbot emits the left event
						continue;
					} else {
						console.log(
							`Spawning meetbot for ${meeting.name} at ${meeting.meetUrl}`,
						);
						await spawnBot(meeting.meetUrl);
					}
				} else {
					// Do Nothing
				}
			}
		}, SCHEDULE_PARSING_INTERVAL);
	} else {
		// Do nothing
	}
}
