import MeetBot from '../../meetbot';

export function attach(bot: MeetBot): void {
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
}
