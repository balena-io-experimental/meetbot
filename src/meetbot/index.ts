import { EventEmitter } from 'events';
import { Browser, Page } from 'puppeteer';

import { newPage } from '../browser';
import { Feature } from './features';
import { clickText } from './google-meet-helpers';
import totp = require('totp-generator');

import { promises as fs } from 'fs';
import * as path from 'path';

export type JobHandler = (page: Page) => Promise<void>;
export type JobQueueFunc = (h: JobHandler) => void;
export interface Bot {
	addJob(handler: JobHandler): void;
	emit<K extends keyof BotEvents, T extends BotEvents[K]>(
		eventName: K,
		event: T,
	): boolean;
	on<K extends keyof BotEvents, T extends BotEvents[K]>(
		eventName: K,
		listener: (arg: T) => void,
	): this;
}

const login = process.env.GOOGLE_EMAIL;
const password = process.env.GOOGLE_PASSWORD;
const totpSecret = process.env.GOOGLE_TOTP_SECRET;

class MeetBot implements Bot {
	public page: Page | null = null;
	public url: string | null = null;
	public joinedAt: string | null = null;
	public transcriptUrl: string | null = null;
	public chatTranscriptUrl: string | null = null;

	private pendingJobs: JobHandler[] = [];
	private leaveRequested: boolean = false;
	private captions: CaptionEvent[] = [];
	private captionTimer: NodeJS.Timer;
	private events = new EventEmitter();

	constructor(private browser: Browser, features: Feature[]) {
		for (const feature of features) {
			feature.attach(this);
		}
		this.captionTimer = setInterval(() => {
			const settledCaptions = this.captions.filter((c) => {
				const captionAgeMs =
					new Date().getTime() - new Date(c.caption.endedAt).getTime();
				return captionAgeMs > 5000;
			});
			settledCaptions.forEach((c) => this.emit('caption', c));
			this.captions = this.captions.filter((c) => !settledCaptions.includes(c));
		}, 1000);
	}

	async init() {
		this.page = await newPage(this.browser);
	}

	public addJob(handler: JobHandler) {
		this.pendingJobs.push(handler);
	}

	// TODOs
	// * replace all selector queries as they are bound to break
	async joinMeet(meetURL: string) {
		if (this.page === null) {
			throw new Error('Meetbot cannot join a meet without an initialized page');
		}
		this.url = meetURL;
		try {
			this.emit('active', { meetURL });

			await this.login();

			console.log('going to Meet after signing in');
			await this.page.screenshot({ path: 'start-meet.png' });
			await this.page.goto(meetURL + '?hl=en', {
				waitUntil: 'networkidle0',
				timeout: 30000,
			});
			// await page.screenshot({ path: 'meet-loaded.png' });

			await this.page.keyboard.type('Hubot', { delay: 10 });

			// console.log('turn off cam using Ctrl+E');
			await this.page.waitForTimeout(3000);
			await this.page.keyboard.down('ControlLeft');
			await this.page.keyboard.press('KeyE');
			await this.page.keyboard.up('ControlLeft');
			await this.page.waitForTimeout(100);

			// console.log('turn off mic using Ctrl+D');
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

			// console.log('Changing layout to Spotlight mode');
			await clickText(this.page, 'more_vert');
			await this.page.waitForTimeout(500);
			await clickText(this.page, 'Change layout');
			await this.page.waitForTimeout(500);
			await clickText(this.page, 'Spotlight');
			await this.page.waitForTimeout(500);
			await this.page.keyboard.press('Escape');
			await this.page.waitForTimeout(500);
			// await this.page.screenshot({ path: 'check-final-layout.png' });

			await this.page.waitForTimeout(1000);
			// await this.page.screenshot({ path: 'after-join.png' });

			this.joinedAt = new Date().toUTCString();

			console.log('Turning on captions');
			this.emit('joined', { meetURL });
			await clickText(this.page, 'more_vert');
			await this.page.waitForTimeout(500);
			await clickText(this.page, 'Captions');
			await this.page.waitForTimeout(500);
			await clickText(this.page, 'English');
			await this.page.waitForTimeout(500);
			await clickText(this.page, 'Apply');
			await this.page.waitForTimeout(500);

			// console.log('open people list to activate feature');
			await clickText(this.page, 'people_outline');
			await this.page.waitForTimeout(500);

			// Inject stenographer into the meet page
			// Function handleCaption can be executed as a callback whenever captions are available.
			const handleCaption = (caption: SteganographerEvent) => {
				this.emit('raw_caption', {
					meetURL,
					caption,
				});
				const existingCaption = this.captions.find(
					(c) => c.caption.id === caption.id,
				);
				if (existingCaption) {
					existingCaption.caption.text = caption.text;
					existingCaption.caption.endedAt = caption.endedAt;
				} else {
					this.captions.push({
						meetURL,
						caption,
					});
				}
			};

			await this.page.exposeFunction('handleCaption', handleCaption);
			const script = (
				await fs.readFile(path.join(__dirname, '../stenographer/index.js'))
			).toString();
			await this.page.evaluate(script);

			// console.log('captions are on');
			await this.page.waitForTimeout(1000);
			// await page.screenshot({ path: 'end.png' });

			console.log('streaming captions');

			while (!this.leaveRequested) {
				await this.page.waitForTimeout(500);

				// names of participants in list
				const participants = await this.page.$$('span.ZjFb7c');
				this.emit('participants', {
					meetURL,
					participants: participants.length,
				});

				if (participants.length === 1) {
					console.log("nobody else is here - I'm leaving...");
					this.emit('left', { meetURL });
					break;
				}

				// This job queue is needed because of the async nature of interacting with the
				// page. Each feature needs full control over the page until it's done.
				// NOTE: after a job the page might be in a different (UI) state than before
				// TBD how to resolve this.
				const curPendingJobs = [...this.pendingJobs];
				this.pendingJobs = [];
				for (
					let job = curPendingJobs.shift();
					job;
					job = curPendingJobs.shift()
				) {
					try {
						await job(this.page);
					} catch (err: any) {
						console.log('ERROR IN FEATURE', err);
					}
				}
			}
		} catch (err) {
			await this.page.screenshot({ path: 'exception.png' });
			console.log('ERROR in meet! Exiting...', meetURL, err);
			this.emit('end', { meetURL });
		} finally {
			clearInterval(this.captionTimer);
			await this.page.close();
			this.emit('end', { meetURL });
			// TODO detach features?
		}
	}

	private async login() {
		if (this.page === null) {
			throw new Error('Meetbot cannot join a meet without an initialized page');
		}
		if (!login || !password || !totpSecret) {
			console.log('running unauthenticated');
			return false;
		}

		const resp = await this.page.goto('https://accounts.google.com/?hl=en');
		if (resp.url().includes('myaccount.google.com')) {
			console.log("we're already logged in");
			return true;
		}
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
		await this.page.waitForTimeout(2000);
		navigationPromise = this.page.waitForNavigation();
		await clickText(this.page, 'Try another way');
		await navigationPromise;
		await this.page.waitForTimeout(2000);
		navigationPromise = this.page.waitForNavigation();
		await clickText(this.page, 'Google Authenticator');
		await navigationPromise;
		await this.page.waitForTimeout(2000);
		await this.page.keyboard.type(totp(totpSecret).toString(), {
			delay: 100,
		});
		await this.page.keyboard.press('Enter');
		await this.page.waitForTimeout(3000);

		await this.page.screenshot({ path: 'after-login.png' });
		return true;
	}

	on<K extends keyof BotEvents, T extends BotEvents[K]>(
		eventName: K,
		listener: (arg: T) => void,
	): this {
		this.events.on(eventName, (a: T) => {
			try {
				return listener(a);
			} catch (err) {
				console.log(`error in '${eventName}':`, err);
			}
		});
		return this;
	}

	emit<K extends keyof BotEvents, T extends BotEvents[K]>(
		eventName: K,
		event: T,
	): boolean {
		return this.events.emit(eventName, event);
	}

	async leaveMeet() {
		if (this.page !== null) {
			// We can't close the page here because it would interrupt whatever pending jobs are running on the main loop
			this.leaveRequested = true;
		}
	}
}

export default MeetBot;
