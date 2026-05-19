const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "https://arenax-frontend.onrender.com",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Add these critical settings for Render
    pingTimeout: 60000,      // Wait 60 seconds for pong before considering connection dead
    pingInterval: 25000,     // Send ping every 25 seconds
    transports: ["websocket", "polling"],
    allowEIO3: true,         // Allow Engine.IO v3 clients
    // Connection state recovery
    connectionStateRecovery: {
      // Disable recovery for better performance on free tier
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── Heartbeat handler (CRITICAL for Render) ──
    socket.on("heartbeat", () => {
      // Respond to client heartbeat to keep connection alive
      socket.emit("pong");
      // Optional: log less frequently to avoid spam
      // console.log(`💓 Heartbeat from ${socket.id}`);
    });

    // Client ready event
    socket.on("client:ready", (data) => {
      console.log(`✅ Client ready: ${socket.id}`);
      // Send initial data if needed
      socket.emit("server:ready", { timestamp: Date.now() });
    });

    // Tournament rooms
    socket.on("join:tournament", (tournamentId) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`Socket ${socket.id} joined tournament:${tournamentId}`);
      
      // Send confirmation back
      socket.emit("joined:tournament", { tournamentId, success: true });
    });

    socket.on("leave:tournament", (tournamentId) => {
      socket.leave(`tournament:${tournamentId}`);
      console.log(`Socket ${socket.id} left tournament:${tournamentId}`);
    });

    // Join a specific match room for live updates
    socket.on("join:match", (matchId) => {
      socket.join(`match:${matchId}`);
      console.log(`Socket ${socket.id} joined match:${matchId}`);
    });

    socket.on("leave:match", (matchId) => {
      socket.leave(`match:${matchId}`);
    });

    // Handle ping from client (alternative to heartbeat)
    socket.on("ping", () => {
      socket.emit("pong");
    });

    // Disconnect handler with better logging
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} - Reason: ${reason}`);
      
      // Log specific reasons for debugging
      if (reason === "ping timeout") {
        console.warn(`⚠️ Socket ${socket.id} disconnected due to ping timeout`);
      } else if (reason === "transport close") {
        console.warn(`⚠️ Socket ${socket.id} disconnected due to transport close`);
      } else if (reason === "client namespace disconnect") {
        console.log(`👋 Socket ${socket.id} disconnected by client`);
      }
    });

    // Error handler
    socket.on("error", (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error.message);
    });
  });

  // Global connection error handler
  io.engine.on("connection_error", (err) => {
    console.error("Socket.IO connection error:", err);
  });

  // Periodic connection health check
  setInterval(() => {
    if (io) {
      const connectedSockets = io.sockets.sockets.size;
      if (connectedSockets > 0) {
        console.log(`📊 Active connections: ${connectedSockets}`);
      }
    }
  }, 60000); // Log every minute

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

const emitToTournament = (tournamentId, event, data) => {
  if (io) {
    io.to(`tournament:${tournamentId}`).emit(event, data);
    console.log(`📡 Emitted "${event}" to tournament:${tournamentId}`);
  }
};

const emitToMatch = (matchId, event, data) => {
  if (io) {
    io.to(`match:${matchId}`).emit(event, data);
    console.log(`📡 Emitted "${event}" to match:${matchId}`);
  }
};

// Helper to emit to all connected clients
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Helper to get room size
const getRoomSize = (roomName) => {
  if (io) {
    const room = io.sockets.adapter.rooms.get(roomName);
    return room ? room.size : 0;
  }
  return 0;
};

module.exports = { 
  initSocket, 
  getIO, 
  emitToTournament, 
  emitToMatch,
  emitToAll,
  getRoomSize,
};