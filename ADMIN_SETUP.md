# E-Commerce Application - Admin Setup Guide

## Overview
This e-commerce application now includes:
- **SQLAlchemy Database**: Persistent storage for products and orders
- **Admin Authentication**: Secure admin panel with API key protection
- **Admin Dashboard**: Add, edit, delete products and manage orders
- **Database Models**: Product and Order models with full CRUD operations

## Prerequisites
- Python 3.8+
- Node.js 14+
- pip (Python package manager)
- npm (Node package manager)

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration
The `.env` file contains:
- `ADMIN_API_KEY`: Default is `admin-secret-key-2026`
- `DATABASE_URL`: SQLite database (local file)
- `PORT`: Server port (default: 5000)

To change the admin key, update `.env`:
```bash
ADMIN_API_KEY=your-secure-key-here
```

### 3. Initialize Database
The database is automatically created on first run with default products:
- Laptop (₹999.99)
- Mouse (₹29.99)
- Keyboard (₹79.99)
- Monitor (₹299.99)
- Headphones (₹149.99)

### 4. Run Backend Server
```bash
python app.py
```
The server will start on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Create .env file
```bash
REACT_APP_API_URL=http://localhost:5000
```

### 3. Start Frontend
```bash
npm start
```
The frontend will open at `http://localhost:3000`

## Admin Panel Access

### 1. Navigate to Admin
Click the **Admin** button in the navigation bar

### 2. Login
Enter the admin API key: `admin-secret-key-2026`

### 3. Features Available

#### Add Products
- Fill in product details (name, price, description, stock)
- Click "Add Product" button
- Product appears immediately in the Products table

#### Edit Products
- Click "Edit" button next to any product
- Modify the details
- Click "Update Product"

#### Delete Products
- Click "Delete" button next to any product
- Confirm deletion

#### Manage Orders
- View all orders in the Orders table
- Change order status (Pending → Processing → Shipped → Delivered)
- Track customer email and total amount

## API Endpoints

### Public Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/<id>` - Get specific product
- `POST /api/orders` - Create order
- `GET /api/orders/<id>` - Get specific order
- `GET /api/stats` - Get statistics
- `POST /api/admin/login` - Admin login

### Admin-Only Endpoints (require `X-Admin-Key` header)
- `POST /api/products` - Create product
- `PUT /api/products/<id>` - Update product
- `DELETE /api/products/<id>` - Delete product
- `GET /api/orders` - Get all orders
- `PUT /api/orders/<id>` - Update order status
- `GET /api/admin/dashboard` - Get admin dashboard data

### Example Admin Request
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: admin-secret-key-2026" \
  -d '{
    "name": "USB Cable",
    "price": 9.99,
    "description": "High-speed USB 3.0 cable",
    "stock": 100
  }'
```

## Database Structure

### Products Table
```
- id (Integer, Primary Key)
- name (String)
- price (Float)
- description (String)
- stock (Integer)
- created_at (DateTime)
- updated_at (DateTime)
```

### Orders Table
```
- id (Integer, Primary Key)
- customer_email (String)
- items (JSON)
- total_price (Float)
- status (String: pending, processing, shipped, delivered, cancelled)
- created_at (DateTime)
- updated_at (DateTime)
```

## Docker Deployment

### Backend Dockerfile
The `backend/Dockerfile` is pre-configured for containerization:
```bash
docker build -t ecommerce-backend .
docker run -p 5000:5000 -e ADMIN_API_KEY=your-key ecommerce-backend
```

### Frontend Dockerfile
The `frontend/Dockerfile` includes the React build:
```bash
docker build -t ecommerce-frontend .
docker run -p 3000:3000 ecommerce-frontend
```

## Kubernetes Deployment

Health check endpoints for Kubernetes:
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

Use the manifests in the `manifests/` folder for Kubernetes deployment.

## Troubleshooting

### Database Issues
If the database gets corrupted:
```bash
rm backend/ecommerce.db
python backend/app.py
```

### CORS Errors
Ensure `REACT_APP_API_URL` matches your backend URL

### Authentication Fails
- Verify admin key in `.env` matches what you're using
- Check `X-Admin-Key` header is being sent correctly

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

## Production Considerations

1. **Security**:
   - Use strong, random admin keys
   - Store keys in secure environment variables
   - Use HTTPS in production
   - Consider implementing JWT tokens

2. **Database**:
   - Use PostgreSQL instead of SQLite for production
   - Update `DATABASE_URL` in `.env`
   - Set up regular backups

3. **Deployment**:
   - Use Kubernetes manifests
   - Set up CI/CD pipeline
   - Configure logging and monitoring

## Support
For issues or questions, check the logs:
- Backend: Check console output from `python app.py`
- Frontend: Check browser console (F12) and npm terminal

---
Version: 2.0.0 | Database: SQLAlchemy | Framework: Flask + React
