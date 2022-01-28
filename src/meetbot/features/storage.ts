import { promises as fs } from 'fs';
import MeetBot from '..';

export const attach = (bot: MeetBot) => {
	let filename: string | null;
	bot.on('joined', () => {
		const id = bot.url.split('/').pop();
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
