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
		console.log('Sending a message through the chat section');
		await clickText(page, 'chat');
		await page.waitForTimeout(1500);
		// await page.screenshot({ path: 'after-chat-open.png' });

		await page.keyboard.type(text, { delay: 10 });
		await page.keyboard.press('Enter');
		// await page.screenshot({ path: 'after-chat.png' });

		await clickText(page, 'chat');
		await page.waitForTimeout(1500);
		// await page.screenshot({ path: 'after-chat-open.png' });
	};
};
