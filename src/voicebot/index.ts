import * as puppeteer from 'puppeteer';

type Options = {
	onEnd: () => void;
};

export async function joinMeet(url: string): Promise<void> {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	console.log(`Joining meet at ${url}`);

	await page.goto(url);

	console.log('waiting for dismiss selector...');
	await page.waitForSelector(
		'#yDmH0d > div.llhEMd.iWO5td > div > div.g3VIld.vdySc.pMgRYb.Up8vH.J9Nfi.iWO5td > div.XfpsVe.J9fJmf > div > span > span',
	);
	await page.click(
		'#yDmH0d > div.llhEMd.iWO5td > div > div.g3VIld.vdySc.pMgRYb.Up8vH.J9Nfi.iWO5td > div.XfpsVe.J9fJmf > div > span > span',
	);

	console.log('clicked dismiss...');
	await page.type('#jd.anon_name', 'Voicebot');

	console.log('finished typing my name');
	await page.waitForSelector(
		'#yDmH0d > c-wiz > div > div > div:nth-child(9) > div.crqnQb > div > div > div.vgJExf > div > div > div.d7iDfe.NONs6c > div > div.Sla0Yd > div > div.XCoPyb > div.uArJ5e.UQuaGc.Y5sE8d.uyXBBb.xKiqt.M9Bg4d > span > span',
	);
	await page.click(
		'#yDmH0d > c-wiz > div > div > div:nth-child(9) > div.crqnQb > div > div > div.vgJExf > div > div > div.d7iDfe.NONs6c > div > div.Sla0Yd > div > div.XCoPyb > div.uArJ5e.UQuaGc.Y5sE8d.uyXBBb.xKiqt.M9Bg4d > span > span',
	);

	console.log('clicked join');

	// start doing logic from extension to capture transcribed voice

	// await browser.close();
}

export async function start(url: string, opts: Options) {
	await joinMeet(url);
	setTimeout(opts.onEnd, 3000000);
}
