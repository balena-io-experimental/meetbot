import { Bot } from '..';
import { postToChatJob } from '../google-meet-helpers';

// Feature to auto validate audio input from attendees in meetings when folks ask the question: Can you hear me?

export const attach = (bot: Bot) => {
	let sayHelloInProgress = 0;
	bot.on('raw_caption', ({ caption }) => {
		if (!caption) {
			return;
		}
		const helloCmd = /can[^a-z]*you[^a-z]*hear[^a-z]*(me|us)/i;
		if (
			helloCmd.test(caption.text) &&
			new Date().getTime() - sayHelloInProgress > 30_000
		) {
			console.log('Someone in the meet has faulty audio.');
			sayHelloInProgress = new Date().getTime();
			bot.addJob(postToChatJob('"Can you hear me??"\nLinux User Detected 🤣'));
			// bot.addJob(postToChatJob('"Can you hear me??"\nYes, I can hear you.'));
		}
	});
};
