import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import MeetBot from '..';
import { clickText, peopleInMeet } from '../google-meet-helpers';

export const attach = (bot: MeetBot) => {
	bot.on('joined', () => {
		console.log('queuing: starting the recording...');
		bot.addJob(startRecording);
	});
};

// Start the recording when the number of people is greater than the prescribed limit
const PEOPLEINMEET_BEFORE_RECORDING = parseInt(
	process.env.PEOPLEINMEET_BEFORE_RECORDING || `${2}`,
	10,
);

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

	while ((await peopleInMeet(page)).length <= PEOPLEINMEET_BEFORE_RECORDING) {
		// console.log("Only 2 people in the call including me so not recording")
		// Will wait for more people to join
	}

	console.log(
		`Threshold reached (${
			(await peopleInMeet(page)).length
		}), starting to record...`,
	);
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
