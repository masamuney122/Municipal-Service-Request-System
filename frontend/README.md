# Municipal Service Request System

A comprehensive platform that enables citizens to report and track local municipal issues, improving transparency and government responsiveness.

## Features

- Citizen Registration and Request Submission
- Request Tracking and Status Updates
- Geolocation and Mapping Integration
- Notification and Alert System
- Administrative Dashboard and Reporting

## Tech Stack

- Frontend: React.js with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- Maps Integration: Google Maps API
- Real-time Updates: Socket.io
- File Storage: Local File System

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Google Maps API key

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_password
   ```

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm start

   # Start frontend server
   cd ../frontend
   npm start
   ```

## Project Structure

```
municipal-service-system/
├── frontend/               # React frontend application
├── backend/               # Node.js backend server
├── docs/                  # Documentation
└── README.md             # Project documentation
```

## API Documentation

API documentation is available at `/api-docs` when running the backend server.

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
