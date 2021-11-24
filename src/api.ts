import express = require('express');
import * as meetbotManager from './meetbot-manager';

const api = express.Router();

api.use(express.json());

api.post('/join', async (req, res) => {
	// Validate body
	if (!req.body.url) {
		return res
			.status(400)
			.send('Unable to join. Missing `url` value in payload body.');
	}
	// Try to spawn a meetbot for location
	try {
		await meetbotManager.spawnBot(req.body.url);
	} catch (e: any) {
		switch (e.message) {
			case 'Invalid Google Meet URL.':
				return res
					.status(400)
					.send(
						`Unable to join. Invalid Google Meet URL provided: ${req.body.url}`,
					);
			case 'Maximum bot queue reached!':
				return res.status(503).send('Max number of active meetbots reached');
			case 'A bot is already in that location!':
				return res.status(400).send('A bot is already at that location');
			default:
				console.error(e);
				return res.status(500).send('Something unexpected happened');
		}
	}
	// Meetbot is joining the meet soon
	return res.status(202).send('A meetbot will be right there.');
});

api.get('/meets', async (_req, res) => {
	const bots = await meetbotManager.listBots();
	return res.status(200).send({ items: bots, count: bots.length });
});

api.post('/leave', async (req, res) => {
	let meetMetadata;
	// Validate body
	if (!req.body.url) {
		return res.status(400).send('Missing `url` value in payload body.');
	}
	try {
		meetMetadata = new URL(req.body.url);
	} catch (e) {
		return res.status(400).send(`Invalid URL provided: ${req.body.url}`);
	}
	// Try to kill meetbot for location
	try {
		await meetbotManager.killBot(meetMetadata.href);
	} catch (e: any) {
		switch (e.message) {
			case 'Could not find bot at specified location!':
				return res.status(400).send('No meetbot found at that location.');
			default:
				console.error(e);
				return res.status(500).send('Something unexpected happened.');
		}
	}
	// Meetbot will be leaving the meet soon
	return res.status(202).send('Asking meetbot to leave.');
});

export default api;
