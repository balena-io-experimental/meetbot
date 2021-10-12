import { expect } from './chai';
import { ImplementClass } from '../lib/index';

describe('TypeScript library skeleton:', function () {
	it('should be able to call myFunc on a new instance', async function () {
		const instance = new ImplementClass();
		expect(instance.myFunc).to.be.a('function');

		await expect(instance.myFunc()).to.eventually.become(
			`I need implementing! 1`,
		);
	});
});
