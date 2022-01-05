import { Box, Button, Navbar } from 'rendition';
import { Logo } from './assets/icons';
import {
	BrowserRouter as Router,
	Redirect,
	Switch,
	Route,
	Link,
} from 'react-router-dom';
import Meetings from './views/Meetings';
import Settings from './views/Settings';
import NotFound from './views/NotFound';
import styled from 'styled-components';

const StyledNavbar = styled((props) => <Navbar {...props} />)`
	background-color: transparent;
`;

function App() {
	return (
		<>
			<Router>
				<StyledNavbar
					brand={
						<Box display="flex">
							<Link to="/">
								<Logo height="40px"></Logo>
							</Link>
						</Box>
					}
				>
					<Link to="/meetings">
						<Button plain href="/">
							Meetings
						</Button>
					</Link>
					<Link to="/settings">
						<Button plain href="/">
							Settings
						</Button>
					</Link>
				</StyledNavbar>
				<Switch>
					<Route exact path="/meetings">
						<Meetings />
					</Route>
					<Route exact path="/settings">
						<Settings />
					</Route>
					<Route path="/not-found">
						<NotFound />
					</Route>
					<Route exact path="/">
						<Redirect to="/meetings" />
					</Route>
					<Redirect to="/not-found" />
				</Switch>
			</Router>
		</>
	);
}

export default App;
