import axios from 'axios';
import {
	JoinMeetRequest,
	LeaveMeetRequest,
	MeetsListResponse,
	SingleMeetResponse,
} from './types';

export const fetchSingleMeet = async (id: string) =>
	axios
		.get(`api/meets/${id}`)
		.then<SingleMeetResponse>((response) => response.data);

export const fetchAllMeets = async () =>
	axios.get('/api/meets').then<MeetsListResponse>((response) => response.data);

export const joinMeet = async (meet: JoinMeetRequest): Promise<void> => {
	return await axios.post('/api/join', meet);
};

export const leaveMeet = async (meet: LeaveMeetRequest): Promise<void> => {
	return await axios.post('/api/leave', meet);
};
