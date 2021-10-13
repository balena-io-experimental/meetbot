import { Bot } from '..';

export const attach = (bot: Bot) => {
	console.log('Running raw caption feature..');
	bot.on('raw_caption', (data: string) => {
		console.log(`Raw caption: ${JSON.stringify(data)}`);
	});
};
