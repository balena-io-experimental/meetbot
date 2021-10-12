import { VoiceBot } from '../../voicebot';

function run(voicebot: VoiceBot): void {
	console.log('Running eventdemo feature...');
	voicebot.on('joined', ({ url }: { url: string }) => {
		console.log('i joined a meeting!', url);
	});
	voicebot.on('captions', ({ url, text }: { url: string; text: string }) => {
		console.log(`i got ${text} from ${url}`);
	});
	voicebot.on('left', ({ url }: { url: string }) => {
		console.log('i left a meeting!', url);
	});
}

export { run };
