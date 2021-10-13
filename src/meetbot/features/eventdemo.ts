import { Bot } from '..';

export const attach = (bot: Bot) => {
	console.log('Running eventdemo feature...');
	bot.on('joined', ({ url }: { url: string }) => {
		console.log('i joined a meeting!', url);
	});
	bot.on('captions', ({ url, text }: { url: string; text: string }) => {
		console.log(`i got ${text} from ${url}`);
	});
	bot.on('left', ({ url }: { url: string }) => {
		console.log('i left a meeting!', url);
	});
};
