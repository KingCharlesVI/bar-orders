// src/socketService.js
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    this.socket = io(SOCKET_URL);
    
    return new Promise((resolve) => {
      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  onInitialOrders(callback) {
    this.socket.on('initial-orders', callback);
  }

  onOrderUpdate(callback) {
    this.socket.on('order-update', callback);
  }

  emitNewOrder(order) {
    this.socket.emit('new-order', order);
  }

  emitUpdateOrder(orderId, newStatus) {
    this.socket.emit('update-order', { orderId, newStatus });
  }
}

export default new SocketService();