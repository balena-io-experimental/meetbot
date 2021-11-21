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

	bot.on('left', ({ meetURL }) => {
		console.log('Leaving the meeting:', meetURL);
	});
};
