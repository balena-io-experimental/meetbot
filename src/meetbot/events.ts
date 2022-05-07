interface ChatEvent {
	timestamp: string | null;
	sender: string | null;
	text: string;
}
interface PeopleInMeetEvent {
	peopleInMeet: number;
}
interface CaptionEvent {
	caption: SteganographerEvent;
}
interface SteganographerEvent {
	image: string;
	person: string;
	text: string;
	startedAt: string;
	endedAt: string;
	id: string;
}
interface StreamEvent {
	transcriptUrl: string | null;
}

interface ChatCommandHelp {
	command: string;
	description: string;
}

interface HelpEvent {
	meetbotChatCommands: ChatCommandHelp[];
}

interface BotEvents {
	chat: ChatEvent;
	left: {};
	joined: {};
	joining: {};
	transcript_doc_ready: StreamEvent;
	chat_transcript_doc_ready: StreamEvent;
	help_event: HelpEvent;
	error: ErrorEvent;
	peopleInMeet: PeopleInMeetEvent;
	raw_caption: CaptionEvent;
	caption: CaptionEvent;
}
