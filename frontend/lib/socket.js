import { io } from 'socket.io-client';
import { getToken } from './auth';
import { API_URL } from './api';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL, { auth: { token: getToken() }, autoConnect: false });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: getToken() };
  if (!s.connected) s.connect();
  return s;
}
