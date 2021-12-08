import { Bot } from '..';
import { postToChatJob } from '../pptr-helpers';

// Chat command to resend important messages again

export const attach = (bot: Bot) => {
	let chatTranscriptUrl: string | null;

	bot.on('chat_transcript_doc_ready', (data) => {
		chatTranscriptUrl = data.transcriptUrl;
	});

	bot.on('chat', ({ text }) => {
		if (text === '/reping') {
			console.log('Reping requested');
			// console.log(typeof(bot));
			// // console.log('This is' + bot.chatTranscriptUrl);
			// console.log('This is' + bot.getContext().chatTranscriptUrl);
			bot.addJob(
				postToChatJob(`Resending chat transcript: ${chatTranscriptUrl}`),
			);
		}
	});
};
