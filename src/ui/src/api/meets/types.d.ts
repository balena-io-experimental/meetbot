export type Meet = {
	id: string;
	url: string;
	joinedAt: Date;
	leftAt: Date;
	transcriptUrl: string | null;
};

export type MeetsListResponse = {
	items: MeetListStub[];
	count: number;
};

export type MeetListStub = {
	id: string;
	url: string;
	status: string;
	transcripts: {
		voice: string;
		chat: string;
	};
	createdAt: Date;
};

export type SingleMeetResponse = {
	items: Meet[];
	count: number;
};

export type JoinMeetRequest = {
	url: string;
};

export type LeaveMeetRequest = {
	url: string;
};
