import * as express from 'express';
import * as bodyParser from 'body-parser';
import { URL } from 'url';

import * as voicebotManager from './voicebot-manager';

const HTTP_PORT = process.env.HTTP_PORT || 8080;
const server = express();

server.use(bodyParser.json());

server.post('/join', (req, res) => {
	let meetMetadata;
	// Validate body
	if (!req.body.url) {
		return res.status(400).send('Missing `url` value in payload body.');
	}
	try {
		meetMetadata = new URL(req.body.url);
	} catch (e) {
		return res.status(400).send('Invalid URL provided: ${url}');
	}
	// Try to spawn a voicebot for location
	try {
		voicebotManager.spawn(meetMetadata.href);
	} catch (e: any) {
		switch (e.message) {
			case 'Maximum bot queue reached!':
				return res.status(503).send('Max number of active voicebots reached');
			case 'A bot is already in that location!':
				return res.status(400).send('A bot is already at that location');
			default:
				console.error(e);
				return res.status(500).send('Something unexpected happened');
		}
	}
	// Voicebot is joining the meet soon
	return res.status(202).send('A voicebot will be right there');
});

export function start() {
	server.listen(HTTP_PORT, () => {
		console.log(`Listening for requests on port ${HTTP_PORT}`);
	});
}
