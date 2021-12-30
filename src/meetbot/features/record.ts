import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { Bot } from '..';
import { clickText } from '../google-meet-helpers';

export const attach = (bot: Bot) => {
	bot.on('joined', () => {
		console.log('queuing: starting the recording...');
		bot.addJob(startRecording);
	});
};

const startRecording = async (page: Page) => {
	if (
		'REC' ===
		(await (
			await page.$('.KHSqkf')
		)?.evaluate((element) => element.textContent))
	) {
		console.log(
			'Recording is already turned on. Not trying to start recording.',
		);
		return;
	}

	console.log('Starting the recording...');
	// await page.screenshot({ path: 'recording-0.png' });
	await clickText(page, 'themes');
	await page.waitForTimeout(2000);
	// await page.screenshot({ path: 'recording-1.png' });

	await clickText(page, 'Recording');
	await page.waitForTimeout(2000);
	// await page.screenshot({ path: 'recording-2.png' });

	const btn = await page.waitForXPath("//*[@aria-label='Start recording']");
	await btn?.click();
	await page.waitForTimeout(2000);

	// Accept the Google Meet consent notice
	await page.keyboard.press('Enter');
	await page.waitForTimeout(500);

	await page.waitForTimeout(2000);
	console.log('Started recording');
	// await page.screenshot({ path: 'recording-3.png' });
};
