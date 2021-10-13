import * as server from './server';

console.log('Initialization meetbot service...');

// Start HTTP server to listen for requests to spawn bots
server.start();
