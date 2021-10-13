import { Bot } from '..';

export const attach = (bot: Bot) => {
	console.log('Running eventdemo feature...');

	bot.on('joined', ({ url }: { url: string }) => {
		console.log('i joined a meeting!', url);
	});

	let sayHelloInProgress = false;
	bot.on('captions', ({ url, texts }: { url: string; texts: string[] }) => {
		if (!texts) {
			return;
		}
		console.log(`i got ${texts.join(' ')} from ${url}`);

		if (
			texts.find((t) => /say[^a-z]*hello[^a-z]*jarvis/i.test(t)) &&
			!sayHelloInProgress
		) {
			sayHelloInProgress = true;
			bot.addJob(async (page) => {
				await page.keyboard.type('What can I do for you, Sir?', {
					delay: 10,
				});
				await page.keyboard.press('Enter');
			});
		} else {
			sayHelloInProgress = false;
		}
	});

	bot.on('left', ({ url }: { url: string }) => {
		console.log('i left a meeting!', url);
	});
};
