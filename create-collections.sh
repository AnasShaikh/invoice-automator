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

# Update users collection to add credit fields
echo "Updating users collection with credit fields..."
UPDATE_USERS_RESPONSE=$(curl -s -X PATCH http://127.0.0.1:8090/api/collections/_pb_users_auth_ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "schema": [
      {
        "name": "email",
        "type": "email",
        "required": true,
        "options": {
          "exceptDomains": [],
          "onlyDomains": []
        }
      },
      {
        "name": "username",
        "type": "text",
        "required": false,
        "options": {
          "min": 3,
          "max": 150,
          "pattern": "^[a-zA-Z0-9][a-zA-Z0-9_.]*[a-zA-Z0-9]$"
        }
      },
      {
        "name": "name",
        "type": "text",
        "required": false
      },
      {
        "name": "avatar",
        "type": "file",
        "required": false,
        "options": {
          "maxSelect": 1,
          "maxSize": 5242880,
          "mimeTypes": [
            "image/jpg",
            "image/jpeg",
            "image/png",
            "image/svg+xml",
            "image/gif",
            "image/webp"
          ]
        }
      },
      {
        "name": "user_type",
        "type": "select",
        "required": false,
        "options": {
          "maxSelect": 1,
          "values": ["free", "credit", "subscriber"]
        }
      },
      {
        "name": "credits_remaining",
        "type": "number",
        "required": false,
        "options": {
          "min": 0
        }
      },
      {
        "name": "subscription_status",
        "type": "select",
        "required": false,
        "options": {
          "maxSelect": 1,
          "values": ["active", "expired", "cancelled"]
        }
      },
      {
        "name": "subscription_expires_at",
        "type": "date",
        "required": false
      },
      {
        "name": "invoices_used",
        "type": "number",
        "required": false,
        "options": {
          "min": 0
        }
      },
      {
        "name": "total_credits_purchased",
        "type": "number",
        "required": false,
        "options": {
          "min": 0
        }
      }
    ]
  }')

if echo "$UPDATE_USERS_RESPONSE" | grep -q '"id"'; then
    echo "✅ Users collection updated successfully with credit fields"
else
    echo "❌ Failed to update users collection"
    echo "Response: $UPDATE_USERS_RESPONSE"
fi

# Create payments collection
echo "Creating payments collection..."
PAYMENTS_RESPONSE=$(curl -s -X POST http://127.0.0.1:8090/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "payments",
    "type": "base",
    "schema": [
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
      },
      {
        "name": "razorpay_payment_id",
        "type": "text",
        "required": false
      },
      {
        "name": "razorpay_order_id",
        "type": "text",
        "required": false
      },
      {
        "name": "amount",
        "type": "number",
        "required": true,
        "options": {
          "min": 0
        }
      },
      {
        "name": "currency",
        "type": "text",
        "required": false
      },
      {
        "name": "type",
        "type": "select",
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["credits", "subscription"]
        }
      },
      {
        "name": "credits_added",
        "type": "number",
        "required": false,
        "options": {
          "min": 0
        }
      },
      {
        "name": "status",
        "type": "select",
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["pending", "success", "failed"]
        }
      }
    ],
    "listRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": null,
    "deleteRule": null
  }')

if echo "$PAYMENTS_RESPONSE" | grep -q '"id"'; then
    echo "✅ Payments collection created successfully"
else
    echo "❌ Failed to create payments collection"
    echo "Response: $PAYMENTS_RESPONSE"
fi

echo ""
echo "✅ Setup complete!"
echo "Collections available:"
echo "- users (with credit system fields)"
echo "- invoices (for storing invoice data)"
echo "- payments (for payment tracking)"
echo ""
echo "PocketBase API URL: http://127.0.0.1:8090/api/"
echo "Admin UI: http://127.0.0.1:8090/_/"