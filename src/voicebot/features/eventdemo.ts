function run(): void {
	console.log('Running eventdemo feature...');
	(global as any).eventEmitter.on('joined', ({ url }: { url: string }) => {
		console.log('i joined a meeting!', url);
	});
	(global as any).eventEmitter.on(
		'captions',
		({ url, text }: { url: string; text: string }) => {
			console.log(`i got ${text} from ${url}`);
		},
	);
	(global as any).eventEmitter.on('left', ({ url }: { url: string }) => {
		console.log('i left a meeting!', url);
	});
}

export { run };
