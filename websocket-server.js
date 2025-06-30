import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils.js';

const wss = new WebSocketServer({ port: 1234 });

console.log('🚀 WebSocket server running on ws://localhost:1234');

wss.on('connection', (ws, req) => {
    console.log('📡 New WebSocket connection');
    setupWSConnection(ws, req);
});

wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down WebSocket server...');
    wss.close(() => {
        console.log('✅ WebSocket server closed');
        process.exit(0);
    });
});