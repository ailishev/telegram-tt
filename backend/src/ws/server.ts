import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { prisma } from '@/lib/prisma';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.WS_CORS_ORIGIN?.split(',') || '*', credentials: true },
});

type TypingPayload = { chatId: string; userId: string };

io.on('connection', (socket) => {
  socket.on('chat:subscribe', async (chatId: string) => {
    socket.join(`chat:${chatId}`);
  });

  socket.on('chat:unsubscribe', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
  });

  socket.on('typing:start', (payload: TypingPayload) => {
    socket.to(`chat:${payload.chatId}`).emit('typing:start', payload);
  });

  socket.on('typing:stop', (payload: TypingPayload) => {
    socket.to(`chat:${payload.chatId}`).emit('typing:stop', payload);
  });

  socket.on('user:online', async (userId: string) => {
    await prisma.user.update({ where: { id: userId }, data: { isOnline: true, lastSeen: new Date() } });
    io.emit('user:online', { userId });
  });

  socket.on('disconnect', () => {
    // Application should map socketId -> userId in Redis for robust online state in multi-instance.
  });
});

export function publishMessageNew(chatId: string, payload: unknown) {
  io.to(`chat:${chatId}`).emit('message:new', payload);
}

export function publishMessageEdit(chatId: string, payload: unknown) {
  io.to(`chat:${chatId}`).emit('message:edit', payload);
}

export function publishMessageDelete(chatId: string, payload: unknown) {
  io.to(`chat:${chatId}`).emit('message:delete', payload);
}

export function publishGiftSend(chatId: string, payload: unknown) {
  io.to(`chat:${chatId}`).emit('gift:send', payload);
}

export function startWsServer(port: number) {
  httpServer.listen(port);
}
