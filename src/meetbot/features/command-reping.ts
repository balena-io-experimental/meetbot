import { Bot } from '..';
import { postToChatJob } from '../pptr-helpers';


/**
 * Resend important messages
 */
export const attach = (bot: Bot) => {
	let chatTranscriptUrl: string | null;

	bot.on('chat_transcript_doc_ready', (data) => {
		chatTranscriptUrl = data.transcriptUrl;
	});

	bot.on('chat', ({ text }) => {
		if (text === '/reping') {
			console.log('Reping requested');
			bot.addJob(
				postToChatJob(`Resending chat transcript: ${chatTranscriptUrl}`),
			);
		}
	});
};
