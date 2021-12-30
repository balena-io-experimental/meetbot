import { promises as fs } from 'fs';
import { Bot } from '..';

export const attach = (bot: Bot) => {
	let filename: string | null;
	bot.on('joined', (joined) => {
		const id = joined.meetURL.split('/').pop();
		filename = `meet-${id}.log`;
	});

	bot.on('caption', (data) => {
		if (!filename) {
			return;
		}
		bot.addJob(async () => {
			await fs.appendFile(filename!, JSON.stringify(data) + '\n');
		});
	});
};
