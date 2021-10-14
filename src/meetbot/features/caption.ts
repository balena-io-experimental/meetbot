import { Bot } from '..';

export const attach = (bot: Bot) => {
	console.log('Running caption feature..');
	bot.on('caption', (data) => {
		console.log(`Caption: ${data.caption.text}`);
	});
};
