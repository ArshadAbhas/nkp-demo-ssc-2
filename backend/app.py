"""
Flask E-Commerce Backend API with Database Support
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone, timedelta
from functools import wraps
import os
import json

# IST timezone (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    """Get current time in IST"""
    return datetime.now(IST)

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///ecommerce.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Admin API Key (use environment variable in production)
ADMIN_API_KEY = os.environ.get('ADMIN_API_KEY', 'admin-secret-key-2026')

# Database Models
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(500))
    stock = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=get_ist_now)
    updated_at = db.Column(db.DateTime, default=get_ist_now, onupdate=get_ist_now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'description': self.description,
            'stock': self.stock,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    customer_email = db.Column(db.String(255))
    items = db.Column(db.JSON)
    total_price = db.Column(db.Float)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=get_ist_now)
    updated_at = db.Column(db.DateTime, default=get_ist_now, onupdate=get_ist_now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_email': self.customer_email,
            'items': self.items,
            'total_price': self.total_price,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-Admin-Key')
        if api_key != ADMIN_API_KEY:
            return jsonify({"error": "Unauthorized: Invalid or missing admin key"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Initialize database with default data
def init_db():
    with app.app_context():
        db.create_all()
        # Check if products already exist
        if Product.query.first() is None:
            default_products = [
                Product(name="Laptop", price=999.99, description="High-performance laptop", stock=10),
                Product(name="Mouse", price=29.99, description="Wireless mouse", stock=50),
                Product(name="Keyboard", price=79.99, description="Mechanical keyboard", stock=30),
                Product(name="Monitor", price=299.99, description="4K Monitor", stock=15),
                Product(name="Headphones", price=149.99, description="Noise-cancelling headphones", stock=25),
            ]
            db.session.add_all(default_products)
            db.session.commit()

# Health check endpoints for Kubernetes
@app.route('/health/live', methods=['GET'])
def liveness():
    """Kubernetes liveness probe - checks if container is alive"""
    return jsonify({"status": "alive"}), 200

@app.route('/health/ready', methods=['GET'])
def readiness():
    """Kubernetes readiness probe - checks if service is ready"""
    return jsonify({"status": "ready"}), 200

# Product endpoints
@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    products = Product.query.all()
    return jsonify([p.to_dict() for p in products]), 200

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get specific product"""
    product = Product.query.get(product_id)
    if product:
        return jsonify(product.to_dict()), 200
    return jsonify({"error": "Product not found"}), 404

@app.route('/api/products', methods=['POST'])
@admin_required
def create_product():
    """Create a new product (admin only)"""
    data = request.json
    try:
        new_product = Product(
            name=data.get('name'),
            price=data.get('price'),
            description=data.get('description'),
            stock=data.get('stock', 0)
        )
        db.session.add(new_product)
        db.session.commit()
        return jsonify(new_product.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    """Update a product (admin only)"""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    data = request.json
    try:
        product.name = data.get('name', product.name)
        product.price = data.get('price', product.price)
        product.description = data.get('description', product.description)
        product.stock = data.get('stock', product.stock)
        product.updated_at = get_ist_now()
        db.session.commit()
        return jsonify(product.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    """Delete a product (admin only)"""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({"message": "Product deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# Order endpoints
@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders"""
    orders = Order.query.all()
    return jsonify([o.to_dict() for o in orders]), 200

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create a new order"""
    data = request.json
    items = data.get('items', [])
    
    # Validate and check stock
    total_price = 0
    for item in items:
        product = Product.query.get(item['productId'])
        if not product:
            return jsonify({"error": f"Product {item['productId']} not found"}), 404
        if product.stock < item['quantity']:
            return jsonify({"error": f"Insufficient stock for product {product.name}"}), 400
        total_price += product.price * item['quantity']
        product.stock -= item['quantity']
    
    try:
        order = Order(
            items=items,
            total_price=total_price,
            status="pending",
            customer_email=data.get('email')
        )
        db.session.add(order)
        db.session.commit()
        return jsonify(order.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Get specific order"""
    order = Order.query.get(order_id)
    if order:
        return jsonify(order.to_dict()), 200
    return jsonify({"error": "Order not found"}), 404

@app.route('/api/orders/<int:order_id>', methods=['PUT'])
@admin_required
def update_order(order_id):
    """Update order status (admin only)"""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    data = request.json
    try:
        order.status = data.get('status', order.status)
        order.updated_at = get_ist_now()
        db.session.commit()
        return jsonify(order.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# Stats endpoint for monitoring
@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get application statistics"""
    total_products = Product.query.count()
    total_stock = db.session.query(db.func.sum(Product.stock)).scalar() or 0
    total_orders = Order.query.count()
    total_revenue = db.session.query(db.func.sum(Order.total_price)).scalar() or 0
    
    return jsonify({
        "total_products": total_products,
        "total_stock": total_stock,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "timestamp": get_ist_now().isoformat()
    }), 200

@app.route('/api/version', methods=['GET'])
def get_version():
    """Get API version"""
    return jsonify({
        "version": "2.0.0",
        "service": "e-commerce-api",
        "database": "SQLAlchemy"
    }), 200

# Admin dashboard endpoints
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    data = request.json
    api_key = data.get('api_key')
    if api_key == ADMIN_API_KEY:
        return jsonify({"token": api_key, "message": "Login successful"}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/admin/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    """Get admin dashboard data"""
    top_products = Product.query.order_by(Product.id.desc()).limit(10).all()
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
    
    return jsonify({
        "products": [p.to_dict() for p in top_products],
        "orders": [o.to_dict() for o in recent_orders],
        "stats": {
            "total_products": Product.query.count(),
            "total_stock": db.session.query(db.func.sum(Product.stock)).scalar() or 0,
            "total_orders": Order.query.count(),
            "total_revenue": db.session.query(db.func.sum(Order.total_price)).scalar() or 0,
        }
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    init_db()
    app.run(host='0.0.0.0', port=port, debug=False)
