import fs = require('fs');

const files = fs.readdirSync(__dirname);

export const all: any = [];

for (const f of files) {
	if (f.endsWith('.js') && f !== 'index.js') {
		/* tslint:disable */
		let module = require(`./${f}`);
		/* tslint:enable */
		all.push(module);
	}
}
