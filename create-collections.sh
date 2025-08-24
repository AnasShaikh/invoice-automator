#!/bin/bash

echo "Setting up PocketBase collections via API..."

# Admin login to get auth token
echo "Authenticating admin..."
AUTH_RESPONSE=$(curl -s -X POST http://127.0.0.1:8090/api/admins/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{
    "identity": "mohdanas211@gmail.com",
    "password": "Curiousity@1111"
  }')

# Extract token
TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to authenticate admin"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

echo "✅ Admin authenticated successfully"

# Create invoices collection
echo "Creating invoices collection..."
COLLECTION_RESPONSE=$(curl -s -X POST http://127.0.0.1:8090/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "invoices",
    "type": "base",
    "schema": [
      {
        "name": "client_name",
        "type": "text",
        "required": true
      },
      {
        "name": "total_amount",
        "type": "number",
        "required": true
      },
      {
        "name": "subtotal",
        "type": "number",
        "required": true
      },
      {
        "name": "gst_amount",
        "type": "number",
        "required": true
      },
      {
        "name": "invoice_data",
        "type": "json",
        "required": true
      },
      {
        "name": "user",
        "type": "relation",
        "required": true,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "maxSelect": 1,
          "displayFields": ["email"]
        }
      }
    ],
    "listRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" && user = @request.auth.id"
  }')

if echo "$COLLECTION_RESPONSE" | grep -q '"id"'; then
    echo "✅ Invoices collection created successfully"
else
    echo "❌ Failed to create invoices collection"
    echo "Response: $COLLECTION_RESPONSE"
fi

echo ""
echo "✅ Setup complete!"
echo "Collections available:"
echo "- users (built-in authentication)"
echo "- invoices (for storing invoice data)"
echo ""
echo "PocketBase API URL: http://127.0.0.1:8090/api/"
echo "Admin UI: http://127.0.0.1:8090/_/"