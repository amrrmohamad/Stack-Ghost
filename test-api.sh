#!/bin/bash

# Stack Ghost - API Test Script
# This script helps you test the API and create sample data

echo "🚀 Stack Ghost API Test Script"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API Base URL
API_URL="http://localhost:3000/api"

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check${NC}"
curl -s http://localhost:3000/health | jq '.'
echo ""

# Test 2: Register a test user
echo -e "${BLUE}Test 2: Register User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@stackghost.com",
    "password": "password123456"
  }')
echo $REGISTER_RESPONSE | jq '.'
echo ""

# Test 3: Login
echo -e "${BLUE}Test 3: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@stackghost.com",
    "password": "password123456"
  }')
echo $LOGIN_RESPONSE | jq '.'
echo ""

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed. Check if user exists or try different credentials.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Token obtained: ${TOKEN:0:20}...${NC}"
echo ""

# Test 4: Get Current User
echo -e "${BLUE}Test 4: Get Current User${NC}"
curl -s -X GET $API_URL/users/me \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 5: Create a Question
echo -e "${BLUE}Test 5: Create Question${NC}"
QUESTION_RESPONSE=$(curl -s -X POST $API_URL/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "How to use async/await in JavaScript?",
    "body": "I am learning JavaScript and having trouble understanding async/await. Can someone explain with examples?",
    "tag_ids": []
  }')
echo $QUESTION_RESPONSE | jq '.'
QUESTION_ID=$(echo $QUESTION_RESPONSE | jq -r '.data.question_id')
echo ""

# Test 6: Get All Questions
echo -e "${BLUE}Test 6: Get All Questions${NC}"
curl -s -X GET "$API_URL/questions?page=1&limit=5" | jq '.'
echo ""

# Test 7: Create an Answer (if question was created)
if [ "$QUESTION_ID" != "null" ] && [ ! -z "$QUESTION_ID" ]; then
  echo -e "${BLUE}Test 7: Create Answer${NC}"
  curl -s -X POST $API_URL/answers \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"body\": \"Async/await is syntactic sugar for Promises. Here's how it works...\",
      \"questionId\": $QUESTION_ID
    }" | jq '.'
  echo ""
fi

# Test 8: Search Questions
echo -e "${BLUE}Test 8: Search Questions${NC}"
curl -s -X GET "$API_URL/questions/search?q=javascript&page=1&limit=5" | jq '.'
echo ""

# Test 9: Get Tags
echo -e "${BLUE}Test 9: Get All Tags${NC}"
curl -s -X GET "$API_URL/tags?page=1&limit=10" | jq '.'
echo ""

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Your token (save this for more tests):"
echo "$TOKEN"
echo ""
echo "To use this token in curl commands:"
echo "  curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/users/me"
echo ""
