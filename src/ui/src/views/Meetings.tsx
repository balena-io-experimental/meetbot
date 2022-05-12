import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useMutation, useQuery } from 'react-query';
import {
	Badge,
	Box,
	Button,
	Container,
	Heading,
	Input,
	Link,
	Modal,
	Spinner,
	Table,
	Txt,
} from 'rendition';
import { toast } from 'react-toastify';
import { fetchAllMeets, joinMeet, leaveMeet } from '../api/meets';
import { Disconnect, Logo, Plus } from '../assets/icons';
import { MeetListStub, MeetsListResponse } from '../api/meets/types';

const StyledBox = styled((props) => <Box {...props} />)`
	display: flex;
	align-items: center;
`;

const StyledButton = styled((props) => <Button {...props} />)`
	:hover {
		svg {
			fill: #fff;
		}
	}
	:active:enabled,
	:focus:enabled {
		svg {
			fill: #fff;
		}
	}
`;

const IconContainer = styled((props) => <Box {...props} />)`
	display: flex;
	align-items: center;
`;

const SpinnerContainer = styled((props) => <Container {...props} />)`
	display: flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
`;

const meetStatus = (joinedAt: Date, leftAt: Date): string => {
	let status = 'waiting';
	if (leftAt) {
		status = 'finished';
	} else if (joinedAt) {
		status = 'ongoing';
	}
	return status;
};

const renderMeetDetailsColumn = (value: any, row: any): JSX.Element => {
	return (
		<StyledBox width="max-content">
			<IconContainer mr="8px">
				<Logo height="32px"></Logo>
			</IconContainer>
			<Box>
				<Txt bold>{row.url.split('/').pop()}</Txt>
				<Link fontSize={'10px'} href={row.url}>
					{row.url}
				</Link>
			</Box>
		</StyledBox>
	);
};

const renderMeetStatusColumn = (value: any, row: any): JSX.Element => {
	const shades = {
		waiting: 14,
		ongoing: 1,
		finished: 5,
	};

	const status = meetStatus(row.joinedAt, row.leftAt);

	return (
		<StyledBox>
			<Badge shade={shades[status]}>{status}</Badge>
		</StyledBox>
	);
};

const renderMeetActionsColumn = (
	row: any,
	onLeave: (url: string) => void,
): JSX.Element => {
	const status = meetStatus(row.joinedAt, row.leftAt);
	const handleLeaveButtonClick = () => {
		onLeave(row.url);
	};
	return (
		<StyledBox>
			{status === 'ongoing' && (
				<Button
					onClick={handleLeaveButtonClick}
					icon={
						<Disconnect
							width={'16px'}
							height={'16px'}
							fill="#BA0C00"
						></Disconnect>
					}
					plain
				></Button>
			)}
		</StyledBox>
	);
};

// const renderMeetParticipantsColumn = (value: any, row: any): JSX.Element => {
// 	return (
// 		<StyledBox>
// 			<Txt mx="auto">{row.participants || '-'}</Txt>
// 		</StyledBox>
// 	);
// };

const renderMeetTranscriptsColumn = (value: any, row: any): JSX.Element => {
	return (
		<StyledBox>
			<Link href={row.chatTranscriptUrl}>Chat</Link>
		</StyledBox>
	);
};

const Home = () => {
	const [isModalOpen, setModalOpen] = useState(false);
	const [urlToJoin, setUrlToJoin] = useState(null);

	const getMeetsQuery = useQuery<MeetsListResponse, any>(
		'meets',
		fetchAllMeets,
	);

	const joinMeetMutation = useMutation(joinMeet, {
		onSuccess: (_data, variables) => {
			getMeetsQuery.refetch();
			toast.success(`Meetbot is on the way to ${variables.url}`);
		},
		onError: (error, variables) => {
			toast.error(`Failed to join ${variables.url}`);
			console.error(error);
		},
	});

	const leaveMeetMutation = useMutation(leaveMeet, {
		onSuccess: (_data, variables) => {
			getMeetsQuery.refetch();
			toast.success(`Meetbot is leaving ${variables.url}`);
		},
		onError: (error, variables) => {
			toast.error(`Failed to leave ${variables.url}`);
			console.error(error);
		},
	});

	useEffect(() => {
		if (isModalOpen) {
			setUrlToJoin(null);
		}
	}, [isModalOpen]);

	const handleJoinButtonClick = (url: string) => {
		joinMeetMutation.mutate({ url });
		setModalOpen(false);
	};

	const handleLeaveMeetButtonClick = (url: string) => {
		leaveMeetMutation.mutate({ url });
	};

	const tableColumns = [
		{
			field: 'url',
			label: 'URL',
			render: renderMeetDetailsColumn,
			sortable: false,
		},
		{
			field: 'transcripts',
			label: 'Transcripts',
			render: renderMeetTranscriptsColumn,
			sortable: false,
		},
		{
			field: 'status',
			label: 'Status',
			render: renderMeetStatusColumn,
			sortable: false,
		},
		// {
		// 	field: 'participants',
		// 	label: 'People',
		// 	render: renderMeetParticipantsColumn,
		// 	sortable: false,
		// },
		{
			label: 'Actions',
			render: (_value: any, row: any): JSX.Element => {
				return renderMeetActionsColumn(row, handleLeaveMeetButtonClick);
			},
			sortable: false,
		},
	];

	const isFetching = getMeetsQuery.isFetching || joinMeetMutation.isLoading;

	return (
		<Container px="120px" pt="64px" pb="100px">
			<Box display="flex">
				<Heading.h2 mb={'48px'}>Meetings</Heading.h2>
				<StyledButton
					ml="auto"
					icon={<Plus height="14px" width="14px" fill="#2A506F" />}
					onClick={() => setModalOpen(true)}
				>
					Join
				</StyledButton>
			</Box>
			<Container>
				{isFetching ? (
					<SpinnerContainer>
						<Spinner />
					</SpinnerContainer>
				) : (
					<Table<MeetListStub>
						usePager
						itemsPerPage={10}
						pagerPosition="both"
						columns={tableColumns}
						data={getMeetsQuery.data.items}
					/>
				)}
			</Container>
			{isModalOpen && (
				<Modal
					action="Join meeting"
					title="Join meeting"
					done={() => handleJoinButtonClick(urlToJoin)}
					cancel={() => setModalOpen(false)}
				>
					<React.Fragment key=".0">
						<Box style={{ gridArea: 'header', alignItems: 'center' }}>
							<Input
								value={urlToJoin}
								onChange={(el) => setUrlToJoin(el.target.value)}
								placeholder="https://meet.google.com/xyz-dasnj-dsz"
							></Input>
						</Box>
					</React.Fragment>
				</Modal>
			)}
		</Container>
	);
};

export default Home;
