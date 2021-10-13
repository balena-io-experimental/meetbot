import MeetBot from '../../meetbot';

export function attach(bot: MeetBot) {
	console.log('Running comment feature..');
	bot.on('data', (data: string) => {
		console.log(`Got ${data}`);
	});
}
