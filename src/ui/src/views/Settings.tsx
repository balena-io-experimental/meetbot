import React from "react";
import { Box, Container, Heading, Spinner, Table } from "rendition";
import styled from "styled-components";

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

type Setting = {
	key: string;
	value: string | undefined;
};

const tableColumns = [
	{
		label: "Key",
		field: "key",
	},
	{
		label: "Value",
		field: "value",
	},
];

const Settings = () => {
	const isFetching = false;

	const mockSettings = [
		{ key: "Google Docs API Key", value: "***********" },
		{ key: "Maximum number of bots", value: "100" },
		{ key: "Greeting", value: "Hello team!" },
	];

	return (
		<Container px="120px" pt="64px" pb="100px">
			<Box display="flex">
				<Heading.h2 mb={"48px"}>Settings</Heading.h2>
			</Box>
			<Container>
				{isFetching ? (
					<SpinnerContainer>
						<Spinner />
					</SpinnerContainer>
				) : (
					<Table<Setting> columns={tableColumns} data={mockSettings} />
				)}
			</Container>
		</Container>
	);
};

export default Settings;
