import React from 'react';
import { Container, Heading } from 'rendition';

const NotFound = () => {
	return (
		<Container px="120px" pt="64px" pb="100px">
			<Container>
				<Heading.h2 mb={'48px'}>404 - Not Found</Heading.h2>
			</Container>
		</Container>
	);
};

export default NotFound;
