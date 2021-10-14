import { Bot } from '..';
import { postToChatJob } from '../pptr-helpers';

export const attach = (bot: Bot) => {
	console.log('Running eventdemo feature...');

	bot.on('joined', ({ meetURL }) => {
		console.log('i joined a meeting!', meetURL);
		bot.addJob(
			postToChatJob('Hello balenistas, its your favorite bot, hubot!!'),
		);
	});

	let sayHelloInProgress = 0;
	bot.on('raw_caption', ({ caption }) => {
		if (!caption) {
			return;
		}
		const helloCmd = /can[^a-z]*you[^a-z]*hear[^a-z]*me/i;
		if (
			helloCmd.test(caption.text) &&
			new Date().getTime() - sayHelloInProgress > 30_000
		) {
			console.log('Dropping some shade to my masters');
			sayHelloInProgress = new Date().getTime();
			bot.addJob(postToChatJob('"Can you hear me??"\nLinux User Detected 🤣'));
		}
	});

	bot.on('chat', (event) => {
		console.log('CHAT', event);
		if (/(do|say)[^a-z]*something[^a-z]*(jarvis|hubot)/i.test(event.text)) {
			bot.addJob(postToChatJob("I'm ready for your text commands"));
		}
	});

	bot.on('left', ({ meetURL }) => {
		console.log('i left a meeting!', meetURL);
	});
};
