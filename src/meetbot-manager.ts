import { Browser } from 'puppeteer';

import MeetBot from './meetbot';
import { newBrowser } from './browser';
import { all as allFeatures } from './meetbot/features';

const MAX_BOTS = process.env.MAX_BOTS || 5;
const ACTIVE_BOTS = new Map();

let browser: Browser | null = null;

export async function init(): Promise<void> {
	if (browser === null) {
		browser = await newBrowser();
	}
}

export async function spawnBot(url: string) {
	if (ACTIVE_BOTS.size >= MAX_BOTS) {
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
		ACTIVE_BOTS.set(url, true);
		console.log(`Current bot queue size: ${ACTIVE_BOTS.size}`);
	});

	bot.on('end', () => {
		console.log(`Removing ${url} from active bot queue`);
		ACTIVE_BOTS.delete(url);
	});

	// Tell bot to start running
	bot.start(url);
}
