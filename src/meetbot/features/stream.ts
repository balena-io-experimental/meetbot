import MeetBot from '..';
import * as fs from 'fs';
import * as moment from 'moment';
import { postToChatJob } from '../google-meet-helpers';
import { Credentials, GoogleDoc } from '../../google/google-doc';

export const attach = async (bot: MeetBot) => {
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
		const docName = `Meeting ${meetId} (${new Date().toISOString()}) Voice Transcript`;
		docId = await doc.create(docName);
		doc.addTitle('Transcript\n\n');
		const documentUrl = `https://docs.google.com/document/d/${docId}`;

		bot.emit('transcript_doc_ready', { transcriptUrl: documentUrl });

		bot.addJob(postToChatJob(`Meet Transcript: ${documentUrl}`));
	});

	/**
	 * Sample of how the Caption event looks like
	 *
	 * {
	 *  image: 'URL of the image',
	 *  person: 'Vipul Gupta',
	 *  text: 'Check check one, two, three.    I am saying something. ',
	 *  startedAt: '2022-05-07T12:17:53.070Z',
	 *  endedAt: '2022-05-07T12:18:09.070Z',
	 * }
	 *
	 */
	bot.on('caption', (data: CaptionEvent) => {
		if (
			!data.caption ||
			!data.caption.text.trim() ||
			!data.caption.startedAt ||
			!data.caption.person ||
			!data.caption.image ||
			data.caption.person.trim().toLowerCase() === 'Meeting host'.toLowerCase()
		) {
			return;
		}

		bot.addJob(async () => {
			const { startedAt, person, image, text } = data.caption;
			const heading = `${moment(startedAt).format(
				'h:mm:ss a UTC',
			)} - ${person}:\n`;
			const message = `${text}\n\n`;
			doc.addHeading(heading);
			doc.addImage(image);
			doc.addText(message);
		});
	});
};
