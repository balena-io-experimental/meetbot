import { Browser } from 'puppeteer';
import { URL } from 'url';

import MeetBot from './meetbot';
import { newBrowser } from './browser';
import { all as allFeatures } from './meetbot/features';

const MAX_BOTS = process.env.MAX_BOTS || 5;
const ACTIVE_BOTS = new Map<string, MeetBot>();

type MeetBotListItem = {
	url: string | null;
	transcriptUrl: string | null;
	chatTranscriptUrl: string | null;
	joinedAt: string | null;
};

let browser: Browser | null = null;

export async function init(): Promise<void> {
	if (browser === null) {
		browser = await newBrowser();
	}
}

export async function listBots() {
	const results: MeetBotListItem[] = [];

	ACTIVE_BOTS.forEach((value: MeetBot, _key: string) => {
		results.push({
			url: value.url,
			transcriptUrl: value.transcriptUrl,
			chatTranscriptUrl: value.chatTranscriptUrl,
			joinedAt: value.joinedAt,
		});
	});

	return results;
}

export async function spawnBot(url: string) {
	const meetURL = new URL(url);

	if (meetURL.hostname !== 'meet.google.com') {
		throw new Error('Invalid Google Meet URL.');
	} else if (ACTIVE_BOTS.size >= MAX_BOTS) {
		throw new Error(`Maximum bot queue reached!`);
	} else if (ACTIVE_BOTS.has(url)) {
		throw new Error(`A bot is already in that location!`);
	} else if (browser === null) {
		throw new Error('Browser instance has not been initialized!');
	}

	// Create a new bot instance with the already created browser instance
	const bot = new MeetBot(browser, allFeatures);
	// Initialize bot (opens a new page)
	await bot.init();

	bot.on('active', () => {
		ACTIVE_BOTS.set(url, bot);
		console.log(`Current bot queue size: ${ACTIVE_BOTS.size}`);
	});

	bot.on('transcript_doc_ready', (data) => {
		bot.transcriptUrl = data.transcriptUrl;
	});

	bot.on('chat_transcript_doc_ready', (data) => {
		bot.chatTranscriptUrl = data.transcriptUrl;
	});

	bot.on('error', (err) => {
		console.error('Unrecoverable bot error occured:', err.message);
		if (bot.url && ACTIVE_BOTS.get(bot.url)) {
			console.log(`Removing ${bot.url} from active bot queue`);
			ACTIVE_BOTS.delete(bot.url);
		}
	});

	// Tell bot to start running
	bot.joinMeet(url);
}

export async function killBot(url: string) {
	const bot = ACTIVE_BOTS.get(url);
	if (bot) {
		console.log(`Killing bot for ${url}`);
		bot.leaveMeet();
	} else {
		throw new Error(`Could not find bot at specified location!`);
	}
}
