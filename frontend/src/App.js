import React, { useState, useEffect } from 'react';
import './App.css';

const menuItems = [
  { id: 1, name: 'Mojito', description: 'Rum, lime, mint, sugar, club soda' },
  { id: 2, name: 'Tommys Margarita', description: 'Tequila, agave syrup, lime juice' },
  { id: 3, name: 'Hugo Spritz', description: 'Prosecco, elderflower cordial, club soda' },
  { id: 4, name: 'Vodka Martini', description: 'Vodka, dry vermouth' },
  { id: 4, name: 'Espresso Martini', description: 'Vodka, espresso' }
];

const OrderStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  PREPARED: 'prepared',
  DELIVERED: 'delivered'
};

const OrderConfirmation = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full m-4">
        <h3 className="text-xl font-semibold mb-4">Order Placed Successfully!</h3>
        <p className="text-gray-600 mb-6">Your drinks are being prepared.</p>
        <button 
          onClick={onClose}
          className="place-order-button"
        >
          OK
        </button>
      </div>
    </div>
  );
};

const CustomerView = ({ onOrderPlaced }) => {
  const [cart, setCart] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const addToCart = (item) => {
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.id === item.id
    );
    
    if (existingItemIndex !== -1) {
      const newCart = [...cart];
      newCart[existingItemIndex] = {
        ...newCart[existingItemIndex],
        quantity: (newCart[existingItemIndex].quantity || 1) + 1
      };
      setCart(newCart);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };
  
  const updateQuantity = (index, change) => {
    const newCart = [...cart];
    const newQuantity = (newCart[index].quantity || 1) + change;
    
    if (newQuantity < 1) {
      newCart.splice(index, 1);
    } else {
      newCart[index] = {
        ...newCart[index],
        quantity: newQuantity
      };
    }
    setCart(newCart);
  };
  
  const placeOrder = () => {
    if (cart.length === 0) return;
    
    const order = {
      items: cart,
      status: OrderStatus.PENDING,
      timestamp: new Date().toISOString()
    };
    
    onOrderPlaced(order);
    setCart([]);
    setShowConfirmation(true);
  };

  return (
    <div className="customer-view">
      <div className="menu-card">
        <h2>Drink Menu</h2>
        <p>Select your drinks</p>
        <div className="menu-items">
          {menuItems.map((item) => (
            <div key={item.id} className="menu-item">
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              <button 
                className="add-button"
                onClick={() => addToCart(item)}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="cart-card">
          <h2>Your Order</h2>
          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <span>{item.name}</span>
                <div className="quantity-controls">
                  <button 
                    className="quantity-button"
                    onClick={() => updateQuantity(index, -1)}
                  >
                    -
                  </button>
                  <span className="quantity-display">
                    {item.quantity || 1}
                  </span>
                  <button 
                    className="quantity-button"
                    onClick={() => updateQuantity(index, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <button 
              className="place-order-button"
              onClick={placeOrder}
            >
              Place Order
            </button>
          </div>
        </div>
      )}
      <OrderConfirmation 
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
      />
    </div>
  );
};

const StaffAuth = ({ onAuth }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/verify-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      
      if (data.valid) {
        onAuth(true);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Failed to verify password');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Staff Login</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter staff password"
          className="password-input"
        />
        <button type="submit" className="auth-button">Login</button>
      </form>
    </div>
  );
};

const StaffView = ({ orders, onUpdateOrder, onDeleteOrder }) => {
  const getStatusClass = (status) => {
    const statusClasses = {
      [OrderStatus.PENDING]: 'status-pending',
      [OrderStatus.IN_PROGRESS]: 'status-progress',
      [OrderStatus.PREPARED]: 'status-prepared',
      [OrderStatus.DELIVERED]: 'status-delivered'
    };
    return statusClasses[status];
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      [OrderStatus.PENDING]: OrderStatus.IN_PROGRESS,
      [OrderStatus.IN_PROGRESS]: OrderStatus.PREPARED,
      [OrderStatus.PREPARED]: OrderStatus.DELIVERED
    };
    return flow[currentStatus];
  };

  return (
    <div className="staff-view">
      <h2>Order Management</h2>
      <div className="orders-grid">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div>
                <h3>Order #{order.id}</h3>
                <p className="timestamp">
                  {new Date(order.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="order-controls">
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
                <button 
                  className="delete-button"
                  onClick={() => onDeleteOrder(order.id)}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="order-items">
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                </div>
              ))}
            </div>
            
            {order.status !== OrderStatus.DELIVERED && (
              <button
                className="update-status-button"
                onClick={() => onUpdateOrder(order.id, getNextStatus(order.status))}
              >
                {order.status === OrderStatus.PENDING && 'Start Preparing'}
                {order.status === OrderStatus.IN_PROGRESS && 'Mark as Prepared'}
                {order.status === OrderStatus.PREPARED && 'Mark as Delivered'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [orders, setOrders] = useState([]);
  const [isStaffView, setIsStaffView] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/orders`)
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error('Failed to load orders:', err));
  }, []);

  const handleOrderPlaced = async (order) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (!response.ok) {
        throw new Error('Failed to place order');
      }
      const newOrder = await response.json();
      setOrders([newOrder, ...orders]);
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  const handleUpdateOrder = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/orders/${orderId}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error('Failed to delete order');
        }
        const updatedOrders = orders.filter(order => order.id !== orderId);
        setOrders(updatedOrders);
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  return (
    <div className="app">
      <button
        className="view-toggle"
        onClick={() => setIsStaffView(!isStaffView)}
      >
        Switch to {isStaffView ? 'Customer' : 'Staff'} View
      </button>

      {isStaffView ? (
        isAuthenticated ? (
          <StaffView 
            orders={orders} 
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDelete}
          />
        ) : (
          <StaffAuth onAuth={setIsAuthenticated} />
        )
      ) : (
        <CustomerView 
          onOrderPlaced={handleOrderPlaced} 
        />
      )}
    </div>
  );
};

export default App;