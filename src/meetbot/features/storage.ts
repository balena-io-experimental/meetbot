import * as fs from 'fs';
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

	bot.on('joined', (joined: JoinEvent) => {
		const filename = `meet-${joined.url}.log`;

		bot.on('data', (data: TranscriptionEvent) => {
			console.log(`Got ${data}`);
			fs.appendFile(filename, JSON.stringify(data) + '\n', function (err: any) {
				if (err) {
					throw err;
				}
			});
		});
	});
};
