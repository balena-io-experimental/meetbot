import { Bot } from '..';
import { postToChatJob } from '../google-meet-helpers';
import fs = require('fs');
import { parse } from 'comment-parser';

function parseChatCommands(): ChatCommandHelp[] {
	const commandHelp: ChatCommandHelp[] = [];
	const files = fs.readdirSync(__dirname);
	const chatCommandRegExp = new RegExp('chat-command-(.*).js$');
	for (const f of files) {
		if (f !== 'index.js' && chatCommandRegExp.test(f)) {
			const ast = parse(
				fs.readFileSync(`${__dirname}/${f}`, { encoding: 'utf8' }),
			);
			commandHelp.push({
				command: `/${chatCommandRegExp.exec(f)![1]}`,
				description: ast[0].description,
			});
		}
	}
	return commandHelp;
}

/**
 * Print help message for meetbot commands
 */
export const attach = (bot: Bot) => {
	const helpText = parseChatCommands();
	bot.on('chat', ({ text }) => {
		if (text === '/help') {
			console.log('Help requested');
			// Post help message on chat
			bot.addJob(
				postToChatJob(
					`Available chat commands: ${helpText
						.map((c) => c.command)
						.join(', ')}`,
				),
			);

			// Meetbot commands can be populated on the dashboard as well
			bot.emit('help_event', {
				meetbotChatCommands: helpText,
			});
		}
	});
};
