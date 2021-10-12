export interface ImplementMe {
	myFunc(): Promise<string>;
}

const moo = 1;

export class ImplementClass implements ImplementMe {
	public async myFunc() {
		return `I need implementing! ${moo}`;
	}
}
