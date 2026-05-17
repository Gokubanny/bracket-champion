const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on("join:tournament", (tournamentId) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`Socket ${socket.id} joined tournament:${tournamentId}`);
    });

    socket.on("leave:tournament", (tournamentId) => {
      socket.leave(`tournament:${tournamentId}`);
    });

    // Join a specific match room for live updates
    socket.on("join:match", (matchId) => {
      socket.join(`match:${matchId}`);
    });

    socket.on("leave:match", (matchId) => {
      socket.leave(`match:${matchId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

const emitToTournament = (tournamentId, event, data) => {
  if (io) io.to(`tournament:${tournamentId}`).emit(event, data);
};

const emitToMatch = (matchId, event, data) => {
  if (io) io.to(`match:${matchId}`).emit(event, data);
};

module.exports = { initSocket, getIO, emitToTournament, emitToMatch };