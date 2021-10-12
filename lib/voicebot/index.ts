type Options = {
	onEnd: () => void;
};

export async function joinMeet(url: string): Promise<void> {
	await console.log(`Joining ${url}`);
}

export function start(url: string, opts: Options) {
	console.log(`Starting voicebot for ${url}`);
	setTimeout(opts.onEnd, 3000);
}
