interface BotEvent {
	meetURL: string;
}
interface ChatEvent extends BotEvent {
	timestamp: string | null;
	sender: string | null;
	text: string;
}
interface ParticipantsEvent extends BotEvent {
	participants: number;
}
interface CaptionEvent extends BotEvent {
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
type LeaveEvent = BotEvent;
type JoinEvent = BotEvent;
type ActiveEvent = BotEvent;
type EndEvent = BotEvent;

interface BotEvents {
	chat: ChatEvent;
	left: LeaveEvent;
	joined: JoinEvent;
	active: ActiveEvent;
	end: EndEvent;
	participants: ParticipantsEvent;
	raw_caption: CaptionEvent;
	caption: CaptionEvent;
}
