import { expect } from './chai';
import { run } from '../src/meetbot/features/storage';
import * as fs from 'fs';

const mockEvents = [
	{
		meet: 'abc-xyz-123',
		timestamp: '1',
		attendee: 'Hubot',
		text: 'hello balena!',
	},
	{
		meet: 'abc-xyz-123',
		timestamp: '2',
		attendee: 'Hubot',
		text: 'hello balena!',
	},
	{
		meet: 'abc-xyz-123',
		timestamp: '3',
		attendee: 'Hubot',
		text: 'hello balena!',
	},
	{
		meet: 'abc-xyz-123',
		timestamp: '4',
		attendee: 'Hubot',
		text: 'hello balena!',
	},
	{
		meet: 'abc-xyz-123',
		timestamp: '5',
		attendee: 'Hubot',
		text: 'hello balena!',
	},
	{
		meet: 'abc-xyz-123',
		timestamp: '6',
		attendee: 'Hubot',
		text: 'hello balena!',
	},
	{
		meet: 'abc-xyz-123',
		timestamp: '7',
		attendee: 'Hubot',
		text: 'hello balena!',
	},
	{
		meet: 'abc-xyz-123',
		timestamp: '8',
		attendee: 'Hubot',
		text: 'hello balena!',
	},
];

describe('Storage feature:', function () {
	it('should be able to append events to file', async function () {
		mockEvents.forEach((ev) => {
			run(ev);
		});
		expect(run).to.be.a('function');

		const data = fs.readFileSync('meet-abc-xyz-123.log', 'utf8');
		const objects = data
			.split('\n')
			.slice(0, -1)
			.map((el) => JSON.parse(el));

		expect(objects.length === mockEvents.length);
	});
});
