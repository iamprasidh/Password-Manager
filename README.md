# Password Manager

A secure password manager application built with React frontend and FastAPI backend.

## Features

- Secure password storage and management
- User authentication and authorization
- Password generation capabilities
- Modern and intuitive user interface

## Tech Stack

- Frontend: React.js
- Backend: FastAPI (Python)
- Database: SQLite

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   python -m uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Access the application at `http://localhost:3000`
2. Create an account or log in
3. Start managing your passwords securely

## Security Features

- Encrypted password storage
- Secure authentication system
- Protection against common security vulnerabilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.