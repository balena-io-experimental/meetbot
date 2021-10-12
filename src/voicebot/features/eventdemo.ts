function run(): void {
	console.log('Running eventdemo feature...');
	(global as any).eventEmitter.on('joined', ({ url }: { url: string }) => {
		console.log('i joined a meeting!', url);
	});
	(global as any).eventEmitter.on(
		'captions',
		({ url, captions }: { url: string; captions: string }) => {
			console.log(`i got ${captions} from ${url}`);
		},
	);
	(global as any).eventEmitter.on('left', ({ url }: { url: string }) => {
		console.log('i left a meeting!', url);
	});
}

export { run };
