import { Page } from 'puppeteer';

export const clickText = async (page: Page, text: string, retries = 3) => {
	const elems = await page.$x(`//*[contains(text(),'${text}')]`);
	let clicked = false;
	for (const el of elems) {
		try {
			await el.click();
			clicked = true;
		} catch {
			// sometimes elements with the same text are found which are not clickable
		}
	}
	if ((elems.length === 0 || !clicked) && retries > 0) {
		await page.waitForTimeout(300);
		await clickText(page, text, retries - 1);
	}
};

export const postToChatJob = (text: string) => {
	return async (page: Page) => {
		// Close the suggestion tip dialog box from meet
		await page.keyboard.press('Escape');
		await page.waitForTimeout(500);

		// await page.screenshot({ path: 'chat-before-open.png' });
		await clickText(page, 'chat');
		await page.waitForTimeout(1500);
		// await page.screenshot({ path: 'chat-open.png' });

		await page.keyboard.type(text, { delay: 10 });
		// await page.screenshot({ path: 'chat-write-text.png' });
		await page.keyboard.press('Enter');
		// await page.screenshot({ path: 'chart-send-text.png' });

		await clickText(page, 'chat');
		await page.waitForTimeout(1500);
		// await page.screenshot({ path: 'chat-close.png' });
		console.log('Message sent on the chat');
	};
};

export const peopleInMeet = async (page: Page) => {
	return (await page.$$('span.zWGUib'))
		? await page.$$('span.zWGUib')
		: Promise.reject(new Error('peopleInMeet function failed'));
};
