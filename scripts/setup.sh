#!/bin/bash

echo "🚀 Setting up QR Attendance System..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files
echo "⚙️ Creating environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env from template"
    echo "⚠️  Please update backend/.env with your MongoDB URI and JWT secrets"
else
    echo "ℹ️  backend/.env already exists"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cp frontend/env.example frontend/.env
    echo "✅ Created frontend/.env from template"
else
    echo "ℹ️  frontend/.env already exists"
fi

# Create logs directory
mkdir -p backend/logs

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your MongoDB URI and JWT secrets"
echo "2. Update frontend/.env with your API URL"
echo "3. Start MongoDB (if running locally)"
echo "4. Run 'npm run dev' to start development servers"
echo ""
echo "Happy coding! 🎉"

