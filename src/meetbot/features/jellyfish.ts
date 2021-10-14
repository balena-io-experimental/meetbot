import { Bot } from '..';
import { getSdk } from '@balena/jellyfish-client-sdk';
export const attach = (bot: Bot) => {
	const authToken = process.env.JELLYFISH_AUTH_TOKEN;
	if (!authToken) {
		console.log(
			'deactivating Jellyfish integration because of missing JELLYFISH_AUTH_TOKEN env',
		);
		return;
	}
	console.log('Running jellyfish feature..');
	const sdk = getSdk({
		apiUrl: 'https://api.ly.fish',
		apiPrefix: 'api/v2',
		authToken,
	});

	bot.on('joined', async (data) => {
		const urlMatch = /https:\/\/jel\.ly\.fish\/(\S+)/i.exec(
			bot.getContext().calendarText,
		);
		if (!urlMatch?.[1]) {
			return;
		}
		const id = urlMatch[1].split('/').pop()!;
		await sdk.event.create({
			target: await sdk.card.get(id),
			type: 'message',
			payload: {
				message: `Someone is having a meet about this at ${data.meetURL}`,
			},
		});
	});
};
