import { Bot } from '..';
import { postToChatJob } from '../google-meet-helpers';

const GREETING_MESSAGE =
	process.env.GREETING_MESSAGE ||
	"Hello folks, it's your favorite bot, hubot!!";

export const attach = (bot: Bot) => {
	bot.on('joined', ({ meetURL }) => {
		console.log('Joined the meeting: ', meetURL);
		bot.addJob(
			postToChatJob(
				GREETING_MESSAGE + `\n(Type /help for available chat commands)`,
			),
		);
	});

	bot.on('left', ({ meetURL }) => {
		console.log('Leaving the meeting:', meetURL);
	});
};
