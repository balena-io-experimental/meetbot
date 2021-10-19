import { Bot } from '..';
import { postToChatJob } from '../pptr-helpers';

export const attach = (bot: Bot) => {
	console.log('Introducing hubot in the meet - feature');

	bot.on('joined', ({ meetURL }) => {
		console.log('Joined the meeting: ', meetURL);
		bot.addJob(
			postToChatJob("Hello balenistas, it's your favorite bot, hubot!!"),
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

	bot.on('left', ({ meetURL }) => {
		console.log('Leaving the meeting:', meetURL);
	});
};
