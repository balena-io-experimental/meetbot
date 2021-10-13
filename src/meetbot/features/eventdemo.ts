import { Page } from 'puppeteer';
import { Bot } from '..';
import { clickText } from '../pptr-helpers';

export const attach = (bot: Bot) => {
	console.log('Running eventdemo feature...');

	bot.on('joined', ({ url }: { url: string }) => {
		console.log('i joined a meeting!', url);
		bot.addJob(postToChatJob('Hello Team-Balena!'));
	});

	const postToChatJob = (text: string) => {
		return async (page: Page) => {
			console.log('open chat section and send a message to all');
			await clickText(page, 'chat');
			await page.waitForTimeout(1500);
			// await page.screenshot({ path: 'after-chat-open.png' });

			await page.keyboard.type(text, { delay: 10 });
			await page.keyboard.press('Enter');
			// await page.screenshot({ path: 'after-chat.png' });

			console.log('close chat section again');
			await clickText(page, 'chat');
			await page.waitForTimeout(1500);
			// await page.screenshot({ path: 'after-chat-open.png' });
		};
	};

	let sayHelloInProgress = false;
	bot.on('captions', ({ url, texts }: { url: string; texts: string[] }) => {
		if (!texts || !texts.length) {
			return;
		}
		console.log(`i got ${texts.join(' ')} from ${url}`);

		if (
			texts.find((t) => /say[^a-z]*hello[^a-z]*jarvis/i.test(t)) &&
			!sayHelloInProgress
		) {
			console.log('saying hello to my masters');
			sayHelloInProgress = true;
			bot.addJob(postToChatJob('What can I do for you, Sir?'));
		} else {
			sayHelloInProgress = false;
		}
	});

	bot.on('left', ({ url }: { url: string }) => {
		console.log('i left a meeting!', url);
	});
};
