import { Bot } from '..';
// import { postToChatJob } from '../pptr-helpers';

import fs = require('fs');
// Chat command to send help text for meetbot commands
const files = fs.readdirSync(__dirname);

export const attach = (bot: Bot) => {
	bot.on('chat', ({ text }) => {
		if (text === '/help') {
			for (const f of files) {
				if (f.endsWith('.js') && f !== 'index.js' && f.startsWith('command-')) {
					console.log(f);
					// bot.addJob(
					//   postToChatJob(`Meet chat transcript: ${f}`),
					// );
				}
			}
		}
	});
};
