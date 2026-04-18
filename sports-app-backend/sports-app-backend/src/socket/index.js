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

    // Join a tournament room to receive live updates
    socket.on("join:tournament", (tournamentId) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`Socket ${socket.id} joined tournament:${tournamentId}`);
    });

    socket.on("leave:tournament", (tournamentId) => {
      socket.leave(`tournament:${tournamentId}`);
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

// Emit helpers used across controllers
const emitToTournament = (tournamentId, event, data) => {
  if (io) io.to(`tournament:${tournamentId}`).emit(event, data);
};

module.exports = { initSocket, getIO, emitToTournament };
