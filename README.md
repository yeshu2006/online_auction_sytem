# Online Auction System

A fully-featured, production-ready MERN stack web application built for real-time item bidding. It replaces traditional static e-commerce with a dynamic, fast-paced websocket environment.

## 🚀 Key Features

* **Real-Time Bidding**: Powered seamlessly by Socket.IO, pushing bid updates to all connected clients instantly.
* **Role-Based Admin Panel**: Secure portal for administrators to manage all users and delete fraudulent auctions.
* **Centralized State**: Leverages Zustand to sync global auth and auction states seamlessly.
* **Clean Premium UI**: Custom lightweight vanilla CSS utilizing modern grid properties, glass panels, and Framer Motion micro-interactions.
* **Robust Security**: Bank-grade JWT authentication and secure hashed passwords (bcrypt).

## 🛠️ Technology Stack

* **Frontend**: React (Vite), Framer Motion, Zustand, React Router DOM, Axios
* **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JSONWebToken, bcryptjs

## 📦 Local Setup Instructions

### Prerequisites
Make sure you have Node JS and a local instance of MongoDB (`mongod`) running on port 27017.

### 1. Start the Backend API
1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Configure your `.env` file (ensure `MONGO_URI`, `PORT=5000`, and `JWT_SECRET` are defined).
4. Run the server: `npm run dev`

### 2. Start the Frontend
1. Open a new terminal tab and navigate: `cd frontend`
2. Install dependencies: `npm install`
3. Launch the Vite server: `npm run dev`

You can test admin functionalities by registering an account and natively mapping your MongoDB `role` field to `admin`.
