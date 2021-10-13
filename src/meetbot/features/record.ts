import MeetBot from '../../meetbot';

export function attach(bot: MeetBot) {
	console.log('Running recod feature..');
	bot.on('settled', () => {
		// This event happens when the bot is no longer clicking buttons and the UI is loaded
		// The logic for this will press the record button
		// bot.page.click('#record')
	});
}
