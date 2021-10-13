import { EventEmitter } from 'events';
import { Browser, Page } from 'puppeteer';

import * as features from './features';
import { newPage } from '../browser';

class MeetBot extends EventEmitter {
	private browser: Browser;
	public page: Page | null = null;
	public url: string | null = null;

	constructor(browser: Browser) {
		super();
		this.browser = browser;
		for (const feature of features.all) {
			feature.attach(this);
		}
	}

	async init() {
		this.page = await newPage(this.browser);
	}

	// TODOs
	// * replace every HACK
	// * replace all selector queries as they are bound to break
	async joinMeet(meetURL: string) {
		if (this.page === null) {
			throw new Error('Meetbot cannot join a meet without an initialized page');
		}
		this.url = meetURL;
		try {
			// await page.goto('https://accounts.google.com/');

			// console.log('typing out email');
			// await page.waitForSelector('input[type="email"]');
			// await page.waitForSelector('#identifierNext');
			// await page.click('input[type="email"]');
			// await page.keyboard.type(login, { delay: 300 });
			// let navigationPromise = page.waitForNavigation();
			// await page.click('#identifierNext');
			// await navigationPromise;
			// await page.waitForTimeout(600); // animations...

			// console.log('typing out password');
			// await page.waitForSelector('input[type="password"]');
			// await page.waitForSelector('#passwordNext');
			// await page.click('input[type="password"]');
			// await page.keyboard.type(password, { delay: 200 });
			// navigationPromise = page.waitForNavigation();
			// await page.click('#passwordNext');
			// await navigationPromise;
			// await page.waitForTimeout(600); // animations...

			// await page.screenshot({ path: 'after-login.png' });

			console.log('going to Meet after signing in');
			await this.page.goto(meetURL);

			// await page.screenshot({ path: 'meet-loaded.png' });

			await this.page.keyboard.type('Hubot', { delay: 10 });

			console.log('turn off cam using Ctrl+E');
			await this.page.waitForTimeout(3000);
			await this.page.keyboard.down('ControlLeft');
			await this.page.keyboard.press('KeyE');
			await this.page.keyboard.up('ControlLeft');
			await this.page.waitForTimeout(100);

			console.log('turn off mic using Ctrl+D');
			await this.page.waitForTimeout(1000);
			await this.page.keyboard.down('ControlLeft');
			await this.page.keyboard.press('KeyD');
			await this.page.keyboard.up('ControlLeft');
			await this.page.waitForTimeout(100);

			await clickText(this.page, 'Ask to join');

			// either the call is recorded and we need to confirm or we eventually get in
			const confirmOrIn = await this.page.waitForXPath(
				"//*[contains(text(),'call_end')]|//*[contains(text(),'Join now')]",
			);
			if (
				(await confirmOrIn?.evaluate((n: any) => n.innerText)) === 'Join now'
			) {
				await clickText(this.page, 'Join now');
				await this.page.waitForXPath("//*[contains(text(),'call_end')]");
			}

			await this.page.waitForTimeout(1500);
			// await page.screenshot({ path: 'after-join.png' });

			console.log('turn on captions');
			this.emit('joined', { url: meetURL });
			await clickText(this.page, 'more_vert');
			await this.page.waitForTimeout(1000);
			await clickText(this.page, 'Captions');
			await this.page.waitForTimeout(1000);
			await clickText(this.page, 'English');
			await this.page.waitForTimeout(1000);
			await clickText(this.page, 'Apply');
			await this.page.waitForTimeout(1000);

			console.log('open people list to activate feature');
			await clickText(this.page, 'people_outline');
			await this.page.waitForTimeout(1000);

			console.log('open chat section and send a message to all');
			await clickText(this.page, 'chat');
			await this.page.waitForTimeout(1500);
			// await page.screenshot({ path: 'after-chat-open.png' });
			await this.page.keyboard.type('Hello, good day everyone!', { delay: 10 });
			await this.page.keyboard.press('Enter');
			// await page.screenshot({ path: 'after-chat.png' });

			console.log('captions are on');
			await this.page.waitForTimeout(1000);
			// await page.screenshot({ path: 'end.png' });

			console.log('streaming captions');

			// HACK replace with proper command infrastructure
			let sayHelloInProgress = false;
			while (true) {
				this.emit('active');
				await this.page.waitForTimeout(500);

				const elems = await this.page.$$('span.CNusmb');
				const texts = await Promise.all(
					elems.map((el) => el.evaluate((node: any) => node.innerText)),
				);
				this.emit('captions', {
					url: meetURL,
					text: texts[0],
				});
				if (
					texts.find((t) => /say[^a-z]*hello[^a-z]*jarvis/i.test(t)) &&
					!sayHelloInProgress
				) {
					sayHelloInProgress = true;
					await this.page.keyboard.type('What can I do for you, Sir?', {
						delay: 10,
					});
					await this.page.keyboard.press('Enter');
				} else {
					sayHelloInProgress = false;
				}

				// names of participants in list
				const participants = await this.page.$$('span.ZjFb7c');
				this.emit('participants', {
					url: meetURL,
					participants: participants.length,
				});

				if (participants.length === 1) {
					console.log("nobody else is here - I'm leaving...");
					this.emit('left', { url: meetURL });
					break;
				}
			}

			await this.page.close();
			this.emit('end');
		} catch (err) {
			await this.page.screenshot({ path: 'exception.png' });
			throw err;
		}
	}

	async start(url: string) {
		await this.joinMeet(url);
	}
}

const clickText = async (page: any, text: string) => {
	const elems = await page.$x(`//*[contains(text(),'${text}')]`);
	for (const el of elems) {
		try {
			await el.click();
		} catch {
			// sometimes we find stuff with the same text which is not clickable
		}
	}
};

export default MeetBot;
