"""
Flask E-Commerce Backend API
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
import json

app = Flask(__name__)
CORS(app)

# In-memory database (for demo purposes)
products = [
    {"id": 1, "name": "Laptop", "price": 999.99, "description": "High-performance laptop", "stock": 10},
    {"id": 2, "name": "Mouse", "price": 29.99, "description": "Wireless mouse", "stock": 50},
    {"id": 3, "name": "Keyboard", "price": 79.99, "description": "Mechanical keyboard", "stock": 30},
    {"id": 4, "name": "Monitor", "price": 299.99, "description": "4K Monitor", "stock": 15},
    {"id": 5, "name": "Headphones", "price": 149.99, "description": "Noise-cancelling headphones", "stock": 25},
]

orders = []

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
    return jsonify(products), 200

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get specific product"""
    product = next((p for p in products if p['id'] == product_id), None)
    if product:
        return jsonify(product), 200
    return jsonify({"error": "Product not found"}), 404

@app.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product (admin only)"""
    data = request.json
    new_product = {
        "id": max([p['id'] for p in products]) + 1 if products else 1,
        "name": data.get('name'),
        "price": data.get('price'),
        "description": data.get('description'),
        "stock": data.get('stock', 0)
    }
    products.append(new_product)
    return jsonify(new_product), 201

# Order endpoints
@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders"""
    return jsonify(orders), 200

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create a new order"""
    data = request.json
    items = data.get('items', [])
    
    # Validate and check stock
    total_price = 0
    for item in items:
        product = next((p for p in products if p['id'] == item['productId']), None)
        if not product:
            return jsonify({"error": f"Product {item['productId']} not found"}), 404
        if product['stock'] < item['quantity']:
            return jsonify({"error": f"Insufficient stock for product {product['name']}"}), 400
        total_price += product['price'] * item['quantity']
        product['stock'] -= item['quantity']
    
    order = {
        "id": len(orders) + 1,
        "items": items,
        "total_price": total_price,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "customer_email": data.get('email')
    }
    
    orders.append(order)
    return jsonify(order), 201

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Get specific order"""
    order = next((o for o in orders if o['id'] == order_id), None)
    if order:
        return jsonify(order), 200
    return jsonify({"error": "Order not found"}), 404

@app.route('/api/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    """Update order status"""
    order = next((o for o in orders if o['id'] == order_id), None)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    data = request.json
    order['status'] = data.get('status', order['status'])
    return jsonify(order), 200

# Stats endpoint for monitoring
@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get application statistics"""
    total_products = len(products)
    total_stock = sum(p['stock'] for p in products)
    total_orders = len(orders)
    total_revenue = sum(o['total_price'] for o in orders)
    
    return jsonify({
        "total_products": total_products,
        "total_stock": total_stock,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/api/version', methods=['GET'])
def get_version():
    """Get API version"""
    return jsonify({
        "version": "1.0.0",
        "service": "e-commerce-api"
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
