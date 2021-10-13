import { Page } from 'puppeteer';

export const clickText = async (page: Page, text: string) => {
	const elems = await page.$x(`//*[contains(text(),'${text}')]`);
	for (const el of elems) {
		try {
			await el.click();
		} catch {
			// sometimes we find stuff with the same text which is not clickable
		}
	}
};
