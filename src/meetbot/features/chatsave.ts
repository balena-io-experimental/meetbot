import * as fs from 'fs';
import MeetBot from '..';
import { Credentials, GoogleDoc } from '../../google/google-doc';
import { postToChatJob } from '../google-meet-helpers';

export const attach = (bot: MeetBot): void => {
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

	bot.on('joined', async () => {
		const meetId = bot.url.split('/').pop();
		const docName = `Meeting ${meetId} (${new Date().toISOString()}) Chat Transcript`;
		docId = await doc.create(docName);
		doc.addTitle('Chat Transcript\n\n');

		const documentUrl = `https://docs.google.com/document/d/${docId}`;

		bot.emit('chat_transcript_doc_ready', { transcriptUrl: documentUrl });

		bot.addJob(
			postToChatJob(
				`Chat transcript: ${documentUrl} (Type "/links" to resend)`,
			),
		);
	});
	bot.on('chat', ({ timestamp, sender, text }) => {
		doc.addHeading(
			`${new Date(+String(timestamp)).toISOString()} - ${sender}:\n`,
		);
		doc.addText(`${text}\n\n`);
	});
};
