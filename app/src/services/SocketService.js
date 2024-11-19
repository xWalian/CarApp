import io from 'socket.io-client';

const SOCKET_URL = 'http://192.168.0.157:12345';

let socket = null;

export const connectSocket = () => {
    socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnect: true,
    });

    socket.on('connect', () => {
        console.log('Połączono z serwerem Socket.io');
    });

    socket.on('disconnect', () => {
        console.log('Rozłączono z serwerem Socket.io');
    });

    socket.on('connect_error', (error) => {
        console.error('Błąd połączenia z socketem: ', error);
    });
};

export const sendMessage = (message) => {
    if (socket && socket.connected) {
        socket.emit('message', message);
    } else {
        console.log('Socket not connected');
    }
};

export const listenToMessages = (callback) => {
    if (socket) {
        socket.on('message', (data) => {
            callback(data);
        });
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        console.log('Rozłączono z socketem');
    }
};
