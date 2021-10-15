import * as fs from 'fs';
import { Bot } from '..';
import { Credentials, GoogleDoc } from '../google-doc';

export const attach = (bot: Bot): void => {
	let credentials: Credentials | null = null;
	try {
		const credentialsFile = fs.readFileSync('credentials.json').toString();
		credentials = JSON.parse(credentialsFile).installed;
	} catch (err) {
		console.log(
			'Cannot read credentials.json - required to use Google Docs writer',
			err,
		);
	}
	if (!credentials) {
		console.log('deactivating google docs feature due to missing credentials');
		return;
	}
	const doc = new GoogleDoc(credentials);
	let docId: string;
	console.log('Attached Chat Saver');

	bot.on('joined', async ({ meetURL }) => {
		const meetId = meetURL.split('/').pop();
		const docName = `Meeting ${meetId} (${new Date().toISOString()}) Chat`;
		docId = await doc.create(docName);
	});
	bot.on('chat', async ({ timestamp, sender, text }) => {
		await doc.addEntry(docId, {
			timestamp: timestamp as string,
			author: sender as string,
			text,
		});
	});
};
