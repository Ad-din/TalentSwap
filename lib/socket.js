import { io } from 'socket.io-client';
import { auth } from './firebase';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let socket = null;

/**
 * Returns a singleton, authenticated socket connection. Re-fetches a fresh
 * Firebase ID token on every call to getSocket() made before the socket
 * exists yet - Socket.IO reuses the same handshake for the life of the
 * connection, so re-authenticating happens naturally on reconnect.
 */
export async function getSocket() {
  if (socket?.connected) return socket;

  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not signed in');

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, { auth: { token }, autoConnect: true });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
