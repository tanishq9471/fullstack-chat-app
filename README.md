# ✨ Full Stack Realtime Chat App ✨

![Demo App](/frontend/public/screenshot-for-readme.png)

A real-time chat application with private messaging and group chat functionality.

## Features

- 🌟 Tech stack: MERN + Socket.io + TailwindCSS + Daisy UI
- 🎃 Authentication & Authorization with JWT + Google OAuth
- 👾 Real-time messaging with Socket.io
- 🚀 Online user status indicators
- 👌 Global state management with Zustand
- 🐞 Error handling both on the server and on the client
- 📧 Email notifications for login and signup events
- 👥 Group chat creation and management
- 📱 Responsive design for all devices
- ⭐ And much more!

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas connection)
- Git

### Quick Start with Script

We've created a convenient script to set up and run the project locally:

```shell
# Make the script executable
chmod +x run-local.sh

# Run the script
./run-local.sh
```

This script will:
- Install all dependencies
- Check MongoDB connection
- Create a sample .env file if needed
- Start both backend and frontend servers

### Manual Setup

1. **Install dependencies:**
   ```shell
   # Root dependencies
   npm install
   
   # Backend dependencies
   cd backend && npm install
   
   # Frontend dependencies
   cd ../frontend && npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   JWT_SECRET=your_jwt_secret
   
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   NODE_ENV=development
   SESSION_SECRET=your_session_secret
   
   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   SEND_EMAIL_NOTIFICATIONS=true
   ```

3. **Start the development servers:**
   ```shell
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

4. **Access the application:**
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:5173

### Production Build

To build and run the app for production:

```shell
# Build the app
npm run build

# Start the app
npm start
```

## Email Notifications Setup

For detailed instructions on setting up email notifications, see [EMAIL_SETUP.md](./EMAIL_SETUP.md).

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Check your connection string in the `.env` file

2. **Port Already in Use**
   - If port 5000 is already in use, you can change it in the `.env` file
   - Kill the process using the port: `lsof -i :5000 | grep node | awk '{print $2}' | xargs kill -9`

3. **Email Notifications Not Working**
   - Make sure you've configured the email settings correctly in the `.env` file
   - For Gmail, you need to use an App Password (see EMAIL_SETUP.md)

4. **Google OAuth Issues**
   - Ensure your Google OAuth credentials are correctly set up
   - Make sure the redirect URI matches what's configured in the Google Developer Console

## License

This project is licensed under the ISC License.
