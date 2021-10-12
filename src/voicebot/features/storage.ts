import * as fs from 'fs';

type MeetbotTranscriptionEvent = {
	meet: string;
	timestamp: string;
	attendee: string;
	text: string;
};

function run(data: MeetbotTranscriptionEvent) {
	const filename = `meet-${data.meet}.log`;

	fs.appendFile(filename, JSON.stringify(data) + '\n', function (err: any) {
		if (err) {
			throw err;
		}
	});
}

export { run };
