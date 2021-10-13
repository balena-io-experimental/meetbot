import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { Bot } from '..';
import { clickText } from '../pptr-helpers';

export const attach = (bot: Bot) => {
	console.log('Running record feature..');
	bot.on('joined', () => {
		console.log('queuing: starting the recording...');
		bot.addJob(startRecording);
	});
};

const startRecording = async (page: Page) => {
	console.log('starting the recording...');
	try {
		await clickText(page, 'themes');
		await page.waitForTimeout(1000);

		await clickText(page, 'Recording');
		await page.waitForTimeout(1000);

		await clickText(page, 'Start recording');
		await page.waitForTimeout(1000);

		await clickText(page, 'Start');
		await page.waitForTimeout(1000);
	} finally {
		// for debugging
		// await page.screenshot({ path: 'after-recording-start.png' });
	}
};
