import { EventEmitter } from 'events';
import { Browser, Page } from 'puppeteer';

import { newPage } from '../browser';
import { Feature } from './features';
import { clickText } from './pptr-helpers';
import totp = require('totp-generator');

import { promises as fs } from 'fs';

export type JobHandler = (page: Page) => Promise<void>;
export type JobQueueFunc = (h: JobHandler) => void;
export interface Bot extends EventEmitter {
	addJob(handler: JobHandler): void;
}

const login = process.env.GOOGLE_LOGIN;
const password = process.env.GOOGLE_PASSWORD;
const totpSecret = process.env.GOOGLE_TOTP_SECRET;

class MeetBot extends EventEmitter implements Bot {
	public page: Page | null = null;
	public url: string | null = null;

	private pendingJobs: JobHandler[] = [];
	private leaveRequested: boolean = false;

	private captions: any[] = [];

	constructor(private browser: Browser, features: Feature[]) {
		super();
		for (const feature of features) {
			feature.attach(this);
		}

		setInterval(() => {
			for (let index = 0; index < this.captions.length; index++) {
				if (
					new Date().getTime() -
						new Date(this.captions[index].caption.endedAt).getTime() >
					5 * 1000
				) {
					this.emit('caption', this.captions[index]);
					this.captions.splice(index, 1);
				}
			}
		}, 1000);
	}

	async init() {
		this.page = await newPage(this.browser);
	}

	public addJob(handler: JobHandler) {
		this.pendingJobs.push(handler);
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
			this.emit('active');

			if (login && password && totpSecret) {
				await this.page.goto('https://accounts.google.com/?hl=en');
				await this.page.evaluate(() => {
					// prevent chromium from using smartcards (aka YubiKeys) as that blocks the process
					window.navigator.credentials.get = () =>
						Promise.reject('no yubi-key for you');
				});

				console.log('typing out email');
				await this.page.waitForSelector('input[type="email"]');
				await this.page.waitForSelector('#identifierNext');
				await this.page.click('input[type="email"]');
				await this.page.keyboard.type(login, { delay: 10 });
				let navigationPromise = this.page.waitForNavigation();
				await this.page.click('#identifierNext');
				await navigationPromise;
				await this.page.waitForTimeout(600); // animations...

				console.log('typing out password');
				await this.page.waitForSelector('input[type="password"]');
				await this.page.waitForSelector('#passwordNext');
				await this.page.click('input[type="password"]');
				await this.page.keyboard.type(password, { delay: 10 });
				navigationPromise = this.page.waitForNavigation();
				await this.page.click('#passwordNext');
				await navigationPromise;

				console.log('doing 2FA login');
				// HACK this is soooo dirty...
				await this.page.waitForTimeout(2_000);
				navigationPromise = this.page.waitForNavigation();
				await clickText(this.page, 'Try another way');
				await navigationPromise;
				await this.page.waitForTimeout(2_000);
				navigationPromise = this.page.waitForNavigation();
				await clickText(this.page, 'Google Authenticator');
				await navigationPromise;
				await this.page.waitForTimeout(2_000);
				await this.page.keyboard.type(totp(totpSecret).toString(), {
					delay: 100,
				});
				await this.page.keyboard.press('Enter');
				await this.page.waitForTimeout(3_000);

				await this.page.screenshot({ path: 'after-login.png' });
			}
			console.log('going to Meet after signing in');
			await this.page.goto(meetURL + '?hl=en');
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

			this.page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

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

			// ------------- Inject stenographer script into the page, and expose a function
			// that can be executed as a callback whenever a caption is available.

			const handleCaption = (caption: any) => {
				// console.log('[caption passed to puppeteer script] => ' + caption);
				this.emit('raw_caption', {
					url: meetURL,
					caption,
				});

				const existingCaption = this.captions.find(
					(c) => c.caption.id === caption.id,
				);
				if (existingCaption) {
					existingCaption.caption.text = caption.caption.text;
					existingCaption.caption.endedAt = caption.caption.endedAt;
				} else {
					this.captions.push({
						url: meetURL,
						caption,
					});
				}
			};

			await this.page.exposeFunction('handleCaption', handleCaption);

			const script = await (
				await fs.readFile('src/stenographer/index.js')
			).toString();

			await this.page.evaluate(script);

			// -------------

			console.log('captions are on');
			await this.page.waitForTimeout(1000);
			// await page.screenshot({ path: 'end.png' });

			console.log('streaming captions');

			while (!this.leaveRequested) {
				await this.page.waitForTimeout(500);

				// const elems = await this.page.$$('span.CNusmb');
				// const texts = await Promise.all(
				// 	elems.map((el) => el.evaluate((node: any) => node.innerText)),
				// );
				// if (texts.length) {
				// 	this.emit('captions', {
				// 		url: meetURL,
				// 		texts,
				// 	});
				// }

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

				// This job queue is needed because of the async nature of interacting with the
				// page. Each feature needs full control over the page until it's done.
				// NOTE: after a job the page might be in a different (UI) state than before
				// TBD how to resolve this.
				for (
					let job = this.pendingJobs.pop();
					job;
					job = this.pendingJobs.pop()
				) {
					try {
						await job(this.page);
					} catch (err: any) {
						console.log('ERROR IN FEATURE', err);
					}
				}
			}

			await this.page.close();
			this.emit('end');
		} catch (err) {
			await this.page.screenshot({ path: 'exception.png' });
			throw err;
		}
	}

	async leaveMeet() {
		if (this.page !== null) {
			// We can't close the page here because it would interrupt whatever pending jobs are running on the main loop
			this.leaveRequested = true;
		}
	}
}

export default MeetBot;
