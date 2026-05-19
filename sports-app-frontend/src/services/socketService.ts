import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://arenax-backend-xybu.onrender.com";

let socket: Socket | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const socketService = {
  connect: () => {
    if (socket?.connected) {
      console.log("Socket already connected:", socket.id);
      return socket;
    }

    // Close existing socket if any
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Timeout settings - CRITICAL for Render
      timeout: 20000,
      pingTimeout: 60000,      // Wait 60s for pong before considering connection dead
      pingInterval: 25000,     // Send ping every 25 seconds
      // Additional options
      forceNew: true,
      rememberUpgrade: true,
    });

    setupEventListeners();
    startHeartbeat();

    return socket;
  },

  disconnect: () => {
    stopHeartbeat();
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    reconnectAttempts = 0;
  },

  joinTournament: (tournamentId: string) => {
    if (socket?.connected) {
      socket.emit("join:tournament", tournamentId);
      console.log(`Joined tournament: ${tournamentId}`);
    } else {
      console.warn("Socket not connected, cannot join tournament");
    }
  },

  leaveTournament: (tournamentId: string) => {
    socket?.emit("leave:tournament", tournamentId);
  },

  onMatchResultConfirmed: (callback: (data: unknown) => void) => {
    socket?.on("match:resultConfirmed", callback);
    return () => { socket?.off("match:resultConfirmed", callback); };
  },

  onTeamApproved: (callback: (data: unknown) => void) => {
    socket?.on("team:approved", callback);
    return () => { socket?.off("team:approved", callback); };
  },

  onTournamentStarted: (callback: (data: unknown) => void) => {
    socket?.on("tournament:started", callback);
    return () => { socket?.off("tournament:started", callback); };
  },

  onTournamentCompleted: (callback: (data: unknown) => void) => {
    socket?.on("tournament:completed", callback);
    return () => { socket?.off("tournament:completed", callback); };
  },

  // NEW: Standings updated listener
  onStandingsUpdated: (callback: (data: unknown) => void) => {
    socket?.on("standings:updated", callback);
    return () => { socket?.off("standings:updated", callback); };
  },

  // Manual reconnect method
  reconnect: () => {
    console.log("Manually reconnecting socket...");
    socketService.disconnect();
    setTimeout(() => {
      socketService.connect();
    }, 1000);
  },

  // Check connection status
  isConnected: () => {
    return socket?.connected ?? false;
  },

  getSocket: () => socket,
};

// Private helper functions
function setupEventListeners() {
  if (!socket) return;

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
    reconnectAttempts = 0;
    socket?.emit("client:ready", { socketId: socket.id });
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
    
    if (reason === "io server disconnect") {
      console.log("Server initiated disconnect, reconnecting...");
      setTimeout(() => {
        socket?.connect();
      }, 1000);
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
    }
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log(`Socket reconnected after ${attemptNumber} attempts`);
  });

  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log(`Reconnection attempt ${attemptNumber}`);
  });

  socket.on("reconnect_error", (error) => {
    console.error("Reconnection error:", error);
  });

  socket.on("reconnect_failed", () => {
    console.error("Reconnection failed permanently");
  });

  socket.on("pong", () => {
    console.log("💓 Heartbeat received from server");
  });
}

function startHeartbeat() {
  stopHeartbeat();
  
  heartbeatInterval = setInterval(() => {
    if (socket?.connected) {
      socket.emit("heartbeat");
      console.log("💓 Heartbeat sent to server");
    }
  }, 25000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}