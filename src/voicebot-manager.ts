import voicebot from './voicebot';

const MAX_BOTS = process.env.MAX_BOTS || 100;
const ACTIVE_BOTS = new Map();

(async () => await voicebot.initialized)();
export function spawn(url: string) {
	if (ACTIVE_BOTS.size >= MAX_BOTS) {
		throw new Error(`Maximum bot queue reached!`);
	} else if (ACTIVE_BOTS.has(url)) {
		throw new Error(`A bot is already in that location!`);
	}

	ACTIVE_BOTS.set(url, true);

	voicebot.start(url, {
		onEnd: () => {
			console.log(`Removing ${url} from active bot queue`);
			ACTIVE_BOTS.delete(url);
		},
	});

	console.log(`Current bot queue size: ${ACTIVE_BOTS.size}`);
}
