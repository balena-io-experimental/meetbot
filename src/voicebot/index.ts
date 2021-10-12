type Options = {
	onEnd: () => void;
};

export async function joinMeet(url: string): Promise<void> {
	await console.log(`Joining ${url}`);
}

export async function start(url: string, opts: Options) {
	await joinMeet(url);
	setTimeout(opts.onEnd, 3000);
}
