import { Page } from 'puppeteer';

export const clickText = async (page: Page, text: string, retries = 3) => {
	const elems = await page.$x(`//*[contains(text(),'${text}')]`);
	let clicked = false;
	for (const el of elems) {
		try {
			await el.click();
			clicked = true;
		} catch {
			// sometimes we find stuff with the same text which is not clickable
		}
	}
	if ((elems.length === 0 || !clicked) && retries > 0) {
		await page.waitForTimeout(300);
		await clickText(page, text, retries - 1);
	}
};
