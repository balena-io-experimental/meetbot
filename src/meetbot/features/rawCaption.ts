import { Bot } from '..';

export const attach = (bot: Bot) => {
	console.log('Running raw caption feature..');
	bot.on('raw_caption', (_data) => {
		// console.log(`Raw caption: ${data.caption.text}`);
	});
};
