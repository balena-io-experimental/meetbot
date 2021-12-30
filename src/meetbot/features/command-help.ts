import { Bot } from '..';
import { postToChatJob } from '../pptr-helpers';
import fs = require('fs');
const Comments = require('parse-comments');
const comments = new Comments();


function commandParser(): CommandHelp[] {
	var commandHelp: CommandHelp[] = []
	const files = fs.readdirSync(__dirname);
	for (const f of files) {
		if (f.endsWith('.js') && f !== 'index.js' && f.startsWith('command-')) {
			const ast = comments.parse(fs.readFileSync(`${__dirname}/${f}`, { encoding: 'utf8' }));
			commandHelp.push({
				"command": "/" + f.replace('command-', '').replace('.js', ''),
				"description": ast[0].description,
			})
		}
	}
	return commandHelp;
}

/**
 * Print help message for meetbot commands
 */
export const attach = (bot: Bot) => {
	const commandHelp = commandParser();
	bot.on('chat', ({ text }) => {
		if (text === '/help') {
			bot.addJob(
				postToChatJob(`Available commands: ${commandHelp.map(c => c.command).join(', ')}`)
				);

			// Meetbot commands can be populated on the dashboard as well
			bot.emit('help_event', {
				meetbotCommands: commandHelp
			});
		};
	})
}
