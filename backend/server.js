const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const server = http.createServer(app);

// Configure CORS middleware first
app.use(cors({
  origin: '*',  // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',  // Allow all origins in development
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());

// Staff password (in a real app, use environment variables and proper hashing)
const STAFF_PASSWORD = "bar123";

// Database setup
let db;
async function setupDb() {
  db = await open({
    filename: 'orders.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      items TEXT,
      status TEXT,
      timestamp TEXT
    );
  `);
}

setupDb().catch(console.error);

// API endpoints
app.post('/api/verify-staff', (req, res) => {
  const { password } = req.body;
  res.json({ valid: password === STAFF_PASSWORD });
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.all('SELECT * FROM orders ORDER BY timestamp DESC');
    res.json(orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    })));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;
    const result = await db.run(
      'INSERT INTO orders (items, status, timestamp) VALUES (?, ?, ?)',
      [JSON.stringify(order.items), order.status, order.timestamp]
    );
    
    // Get the inserted order with its ID
    const savedOrder = await db.get('SELECT * FROM orders WHERE id = ?', result.lastID);
    savedOrder.items = JSON.parse(savedOrder.items);
    
    // Emit the new order to all connected clients
    io.emit('order-update', savedOrder);
    
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    
    // Get updated orders and notify clients
    const orders = await db.all('SELECT * FROM orders ORDER BY timestamp DESC');
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    
    io.emit('orders-update', parsedOrders);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM orders WHERE id = ?', [id]);
    
    // Get updated orders and notify clients
    const orders = await db.all('SELECT * FROM orders ORDER BY timestamp DESC');
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    
    io.emit('orders-update', parsedOrders);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3021;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});