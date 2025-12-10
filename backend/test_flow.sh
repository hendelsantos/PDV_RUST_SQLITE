#!/bin/bash
# 1. Register (ignore error if exists)
echo "1. Registering..."
curl -s -X POST -H "Content-Type: application/json" -d '{"email": "sales@example.com", "password": "password123"}' http://127.0.0.1:3000/auth/register
echo -e "\n"

# 2. Login and get Token
echo "2. Logging in..."
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email": "sales@example.com", "password": "password123"}' http://127.0.0.1:3000/auth/login | jq -r .token)
echo "Token: ${TOKEN:0:20}..."

# 3. Create Product
echo "3. Creating Product..."
PRODUCT_ID=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
 -d '{"name": "Teclado Mecanico", "description": "RGB", "price": 25000, "stock_quantity": 50, "sku": "KB-001"}' \
 http://127.0.0.1:3000/products/ | tr -d '"')
echo "Product ID: $PRODUCT_ID"

# 4. List Products
echo "4. Listing Products..."
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3000/products/ | jq
echo -e "\n"

# 5. Create Sale
echo "5. Creating Sale..."
SALE_ID=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
 -d "{\"payment_method\": \"pix\", \"items\": [{\"product_id\": \"$PRODUCT_ID\", \"quantity\": 2}]}" \
 http://127.0.0.1:3000/sales/ | tr -d '"')
echo "Sale ID: $SALE_ID"

# 6. List Sales
echo "6. Listing Sales..."
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3000/sales/ | jq
echo -e "\n"
