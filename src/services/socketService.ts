import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://arenax-backend-xybu.onrender.com";

let socket: Socket | null = null;

export const socketService = {
  connect: () => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: true,
      });
    }
    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  joinTournament: (tournamentId: string) => {
    socket?.emit("join:tournament", tournamentId);
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

  getSocket: () => socket,
};