const { Server } = require('socket.io');
let io = null;

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user authentication
    socket.on('authenticate', (userId) => {
      console.log('User authenticated:', userId);
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected');
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
    });
  });

  return io;
}

// Function to emit notification to all connected users
function emitNotification(notification) {
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }
  
  try {
    // Emit to all users
    io.emit('notification', notification);
    console.log('Notification emitted to all users:', notification);

    // If notification has a specific userId, also emit to that user
    if (notification.userId) {
      const socketId = connectedUsers.get(notification.userId.toString());
      if (socketId) {
        io.to(socketId).emit('notification', notification);
        console.log('Notification also sent to specific user:', notification.userId);
      }
    }
  } catch (error) {
    console.error('Error emitting notification:', error);
  }
}

// Function to send notification to a specific user
function sendNotification(userId, notification) {
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }

  try {
    const socketId = connectedUsers.get(userId.toString());
    if (socketId) {
      io.to(socketId).emit('notification', notification);
      console.log('Notification sent to user:', userId);
    } else {
      console.log('User not connected:', userId);
      // Store notification in database for later delivery
      storeNotification(userId, notification);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

module.exports = { 
  initializeSocket,
  emitNotification,
  sendNotification
}; 