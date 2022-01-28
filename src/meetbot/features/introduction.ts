import MeetBot from '..';
import { postToChatJob } from '../google-meet-helpers';

const GREETING_MESSAGE =
	process.env.GREETING_MESSAGE ||
	"Hello folks, it's your favorite bot, hubot!!";

export const attach = (bot: MeetBot) => {
	bot.on('joined', () => {
		console.log('Joined the meeting: ', bot.url);
		bot.addJob(
			postToChatJob(
				GREETING_MESSAGE + `\n(Type /help for available chat commands)`,
			),
		);
	});

	bot.on('left', () => {
		console.log('Leaving the meeting:', bot.url);
	});
};
