import * as fs from 'fs';

import MeetBot from '../../meetbot';

type transcriptionEvent = {
	meet: string;
	timestamp: string;
	attendee: string;
	text: string;
};

export function attach(bot: MeetBot) {
	console.log('Running flowdock feature..');
	const filename = `meet-${bot.url}.log`;

	bot.on('data', (data: transcriptionEvent) => {
		console.log(`Got ${data}`);
		fs.appendFile(filename, JSON.stringify(data) + '\n', function (err: any) {
			if (err) {
				throw err;
			}
		});
	});
}
