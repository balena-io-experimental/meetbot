import {
	createServer,
	Model,
	Server,
	Factory,
	RestSerializer,
	Request,
	ModelInstance,
} from 'miragejs';
import { Meet, MeetsListResponse } from '../api/meets/types';
import { API_URL } from '../env';
import { DateTime } from 'luxon';
import Schema from 'miragejs/orm/schema';
import { MaybePromise } from 'miragejs/server';

const randomMeetID = (): string => {
	const randomSequence = (
		len: number,
		characters: string = 'abcdefghijklmnopqrstuvwxyz',
	) => {
		let result = '';
		for (let i = 0; i < len; i++) {
			result += characters.charAt(
				Math.floor(Math.random() * characters.length),
			);
		}
		return result;
	};
	return `${randomSequence(3)}-${randomSequence(4)}-${randomSequence(3)}`;
};

export const setupMockServer = () => {
	console.info('[miragejs] setting up mock server...');
	createServer({
		models: {
			meet: Model.extend<Partial<Meet>>({}),
		},
		routes() {
			this.namespace = `${API_URL}/api`;
			this.get(`/meets`, (schema: Schema<ModelInstance>): MeetsListResponse => {
				const items = schema.db.meets;
				return { items, count: items.length };
			});
			this.post(
				`/join`,
				(
					_schema: Schema<ModelInstance>,
					_req: Request,
				): MaybePromise<Response | object> => {
					// let attrs: JoinMeetRequest = JSON.parse(req.requestBody)
					return new Response();
				},
			);
			this.post(
				`/leave`,
				(
					_schema: Schema<ModelInstance>,
					_req: Request,
				): MaybePromise<Response | object> => {
					// let attrs: LeaveMeetRequest = JSON.parse(req.requestBody)
					return new Response();
				},
			);
		},
		seeds(server: Server) {
			server.createList('meet', 20);
		},
		factories: {
			meet: Factory.extend<Partial<Meet>>({
				get url() {
					return () => `https://meet.google.com/${randomMeetID()}`;
				},
				get joinedAt() {
					return () =>
						Math.random() < 0.1
							? undefined
							: DateTime.now()
									.minus({ minutes: Math.round(120 * Math.random()) })
									.toJSDate();
				},
				get leftAt() {
					return () =>
						Math.random() < 0.2
							? undefined
							: DateTime.now()
									.minus({ minutes: Math.round(60 * Math.random()) })
									.toJSDate();
				},
				// get transcriptUrl() {
				// 	return () => 'http://www.google.com';
				// },
			}),
		},
		serializers: {
			application: RestSerializer,
		},
	});
	console.info('[miragejs] mock server ready.');
};

export default {};
