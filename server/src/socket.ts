import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from './config';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join order-specific room for tracking
    socket.on('track-order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`[Socket.IO] ${socket.id} tracking order ${orderId}`);
    });

    // Join admin room
    socket.on('join-admin', () => {
      socket.join('admin');
      console.log(`[Socket.IO] ${socket.id} joined admin room`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// Emit order status change to all relevant rooms
export function emitOrderUpdate(orderId: string, data: any) {
  if (!io) return;
  io.to(`order:${orderId}`).emit('order-updated', data);
  io.to('admin').emit('order-updated', data);
}

// Emit new order to admin room
export function emitNewOrder(data: any) {
  if (!io) return;
  io.to('admin').emit('new-order', data);
}

// Emit queue update to all clients
export function emitQueueUpdate(data: any) {
  if (!io) return;
  io.emit('queue-updated', data);
}

// Emit restock alert to admin
export function emitRestockAlert(data: any) {
  if (!io) return;
  io.to('admin').emit('restock-alert', data);
}

// Emit master call to admin
export function emitMasterCall(data: any) {
  if (!io) return;
  io.to('admin').emit('master-call', data);
}
