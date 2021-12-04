import { Bot } from '..';
import { postToChatJob } from '../meetbot-helpers';

const GREETING_MESSAGE =
	process.env.GREETING_MESSAGE ||
	"Hello balenistas, it's your favorite bot, hubot!!";

export const attach = (bot: Bot) => {
	console.log('Introducing hubot in the meet - feature');

	bot.on('joined', ({ meetURL }) => {
		console.log('Joined the meeting: ', meetURL);
		bot.addJob(postToChatJob(GREETING_MESSAGE));
	});

	bot.on('left', ({ meetURL }) => {
		console.log('Leaving the meeting:', meetURL);
	});
};
