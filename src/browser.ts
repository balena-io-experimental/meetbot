import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import { existsSync } from 'fs';

import StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

export async function newBrowser(): Promise<Browser> {
	const puppeteerOptions = {
		headless: true,
		args: [
			// https://stackoverflow.com/questions/52464583/possible-to-get-puppeteer-audio-feed-and-or-input-audio-directly-to-puppeteer
			// https://kapeli.com/cheat_sheets/Chromium_Command_Line_Switches.docset/Contents/Resources/Documents/index
			'--use-fake-ui-for-media-stream',
			'--use-fake-device-for-media-stream',
			'--use-file-for-fake-audio-capture=/home/mj/experiment/meet-the-bots/example.wav',
			'--allow-file-access',
			'--lang=en',
			'--no-sandbox',
		],
		env: {
			LANG: 'en',
		},
		defaultViewport: { height: 912, width: 1480 },
	};

	if (existsSync('/usr/bin/chromium-browser')) {
		console.log('Altering puppeteer chromium path...');
		/* @ts-ignore */
		puppeteerOptions.executablePath = '/usr/bin/chromium-browser';
	}

	const browser = await puppeteer.launch(puppeteerOptions);
	browser
		.defaultBrowserContext()
		.overridePermissions('https://meet.google.com/', [
			'microphone',
			'camera',
			'notifications',
		]);

	return browser;
}

export async function newPage(browser: Browser): Promise<Page> {
	const page = await browser.newPage();
	await page.setExtraHTTPHeaders({
		'Accept-Language': 'en',
		'sec-ch-ua':
			'"Chromium";v="94", "Microsoft Edge";v="94", ";Not A Brand";v="99"',
	});
	// Set the language forcefully on javascript
	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(navigator, 'language', {
			get() {
				return 'en';
			},
		});
		Object.defineProperty(navigator, 'languages', {
			get() {
				return ['en'];
			},
		});
	});
	return page;
}
