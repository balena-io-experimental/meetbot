import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'rendition';
import { setupMockServer } from './mocks';
import { QueryClient, QueryClientProvider } from 'react-query';
import { DEV } from './env';
import App from './App';
import { createGlobalStyle } from 'styled-components';
import reset from 'styled-reset';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

if (DEV) {
	setupMockServer();
}

const queryClient = new QueryClient();

const GlobalStyles = createGlobalStyle`
  ${reset}
  body {
	  min-height: 100vh;
  }
`;

ReactDOM.render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<Provider>
				<App />
				<ToastContainer
					position="top-center"
					autoClose={3000}
					hideProgressBar={true}
					newestOnTop={true}
					theme="colored"
					closeOnClick
					pauseOnHover
				/>
				<GlobalStyles />
			</Provider>
		</QueryClientProvider>
	</React.StrictMode>,
	document.getElementById('root'),
);
