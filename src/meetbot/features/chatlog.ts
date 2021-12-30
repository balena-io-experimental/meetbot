import { Page } from 'puppeteer';
import { Bot } from '..';

interface MessageGroup {
	timestamp: string;
	sender: string;
	messages: string[];
}

class Messenger {
	private messages: any = new Map();

	public updateGroup(newGroup: MessageGroup): string[] {
		const groupId = newGroup.timestamp + newGroup.sender;
		const existingGroup = this.messages.get(groupId);
		this.messages.set(groupId, newGroup);
		if (existingGroup) {
			return newGroup.messages.slice(existingGroup.messages.length);
		}
		return newGroup.messages;
	}
}

export const attach = (bot: Bot) => {
	let chatHandler: Messenger;
	let url: string;

	bot.on('joined', ({ meetURL }) => {
		chatHandler = new Messenger();
		url = meetURL;
		bot.addJob(monitorChat);
	});

	const monitorChat = async (page: Page) => {
		const chatItems = await page.$$('div.GDhqjd');
		const events: ChatEvent[] = [];
		await Promise.all(
			chatItems.map(async (chatDiv) => {
				const chatTextItems = await chatDiv.$$('.oIy2qc');
				const texts = await Promise.all(
					chatTextItems.map((textDiv) =>
						textDiv.evaluate((node) => node.textContent),
					),
				);
				const timestamp = await chatDiv.evaluate((node) =>
					node.getAttribute('data-timestamp'),
				);
				const sender = await chatDiv.evaluate((node) =>
					node.getAttribute('data-sender-name') === 'You'
						? 'Hubot'
						: node.getAttribute('data-sender-name'),
				);
				const messageGroup = {
					timestamp: timestamp as string,
					sender: sender as string,
					messages: texts as string[],
				};
				const newMessages = chatHandler.updateGroup(messageGroup);
				newMessages.forEach((m) =>
					events.push({ meetURL: url, timestamp, sender, text: m }),
				);
			}),
		);
		for (const event of events) {
			bot.emit('chat', event);
		}
		bot.addJob(monitorChat); // bot removes the job after running it, so re-add it
	};
};
