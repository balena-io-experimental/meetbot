import { promises as fs } from 'fs';
import { Bot } from '..';

interface TranscriptionEvent {
	meet: string;
	timestamp: string;
	attendee: string;
	text: string;
}

interface JoinEvent {
	url: string;
}

export const attach = (bot: Bot) => {
	console.log('Running storage feature..');

	let filename: string | null;
	bot.on('joined', (joined: JoinEvent) => {
		const id = joined.url.split('/').pop();
		filename = `meet-${id}.log`;
	});

	bot.on('captions', (data: TranscriptionEvent) => {
		if (!filename) {
			return;
		}
		bot.addJob(async () => {
			await fs.appendFile(filename!, JSON.stringify(data) + '\n');
		});
	});
};
