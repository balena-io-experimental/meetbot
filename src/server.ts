import * as express from 'express';
import path = require('path');
import api from './api';

import * as meetbotManager from './meetbot-manager';

const HTTP_PORT = process.env.HTTP_PORT || 8080;

const server = express();
server.use('/api', api);

server.use('/', express.static(path.join(__dirname, './www')));
server.get('/*', (_req, res) =>
	res.sendFile(path.resolve(__dirname, './www', 'index.html')),
);

export async function start() {
	await meetbotManager.init();
	server.listen(HTTP_PORT, () => {
		console.log(`Listening for requests on port ${HTTP_PORT}`);
	});
}
