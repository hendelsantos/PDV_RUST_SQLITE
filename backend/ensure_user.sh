#!/bin/bash
curl -s -X POST -H "Content-Type: application/json" -d '{"email": "ops@example.com", "password": "password123"}' http://127.0.0.1:3000/auth/register
echo "Ensure user request sent."
