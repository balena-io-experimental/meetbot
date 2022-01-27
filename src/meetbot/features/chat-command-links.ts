import MeetBot from '..';
import { postToChatJob } from '../google-meet-helpers';

/**
 * Sends transcript links to chat again
 */
export const attach = (bot: MeetBot) => {
	let chatTranscriptUrl: string | null;
	let transcriptUrl: string | null;

	bot.on('chat_transcript_doc_ready', (data) => {
		chatTranscriptUrl = data.transcriptUrl;
	});

	bot.on('transcript_doc_ready', (data) => {
		transcriptUrl = data.transcriptUrl;
	});

	bot.on('chat', ({ text }) => {
		if (text === '/links') {
			console.log('Links requested');
			bot.addJob(
				postToChatJob(
					`Resending chat transcript: ${chatTranscriptUrl}\nMeet Transcript: ${transcriptUrl}`,
				),
			);
		}
	});
};
