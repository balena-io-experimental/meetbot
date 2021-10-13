import { Bot } from '..';

export const attach = (bot: Bot) => {
	console.log('Running comment feature..');
	bot.on('data', (data: string) => {
		console.log(`Got ${data}`);
	});
};
