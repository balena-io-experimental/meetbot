import fs = require('fs');
import MeetBot from '..';

const files = fs.readdirSync(__dirname);

export type Feature = {
	attach: (bot: MeetBot) => void;
};

export const all: Feature[] = [];

for (const f of files) {
	if (f.endsWith('.js') && f !== 'index.js') {
		/* tslint:disable */
		let module = require(`./${f}`);
		/* tslint:enable */
		if (typeof module.attach === 'undefined') {
			throw new Error(`${f} feature does not implement Feature`);
		}
		all.push(module as Feature);
	}
}
