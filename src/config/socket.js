const jwt = require('jsonwebtoken');
let io;

const initializeSocket = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || 
                         socket.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                console.log('[Socket] Connection rejected: No token provided');
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            console.log(`[Socket] User authenticated: ${decoded.role} (ID: ${decoded.id})`);
            next();
        } catch (error) {
            console.error('[Socket] Authentication error:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id} - Role: ${socket.user.role}`);

        // Join room based on user role
        if (socket.user.role === 'super-admin') {
            socket.join('room:super-admin');
            console.log(`[Socket] User ${socket.user.id} joined room:super-admin`);
        } else {
            console.log(`[Socket] User ${socket.user.id} with role ${socket.user.role} not authorized for admin room`);
            // Optionally disconnect non-admin users attempting to join admin channels
            // socket.disconnect();
        }

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id} - Role: ${socket.user?.role}`);
        });

        socket.on('error', (error) => {
            console.error(`[Socket] Error on socket ${socket.id}:`, error);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { initializeSocket, getIO };
