# STILL WORKING ON THIS PROJECT!!! many things need to be improved !!!

# Budget Manager

A comprehensive personal finance tracking application built with React Native and Firebase. This mobile app allows users to track their expenses and income, manage their budget, and view their financial history - all with seamless offline/online synchronization.

## Features

- 📱 Cross-platform mobile application (iOS & Android)
- 👤 User authentication and account management
- 💰 Income and expense tracking with categories
- 📊 Financial overview dashboard
- 🔄 Offline mode with automatic synchronization
- 🌐 Cloud backup of all transaction data
- 🔒 Secure data storage

## Technologies Used

- **Frontend**:
  - React Native (Expo)
  - TypeScript
  - Expo Router for navigation
  - React Context API for state management
  
- **Backend**:
  - Firebase Authentication
  - Firebase Firestore (NoSQL database)
  
- **Development Tools**:
  - ESLint & Prettier for code formatting
  - Jest for testing
  - TypeScript for type checking

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Firebase account

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/budget-manager.git
   cd budget-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a Firebase project:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Set up Authentication (Email/Password)
   - Create a Firestore database
   - Register your app and download the configuration

4. Create a `.env` file in the project root and add your Firebase configuration:
   ```
    EXPO_PUBLIC_API_KEY = 
    EXPO_PUBLIC_AUTH_DOMAIN = 
    EXPO_PUBLIC_PROJECT_ID = 
    EXPO_PUBLIC_STORAGE_BUCKET = 
    EXPO_PUBLIC_SENDER_ID = 
    EXPO_PUBLIC_APP_ID = 
    EXPO_PUBLIC_MEASUREMENT_ID = 
   ```

5. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Project Structure

```
budget-manager/
├── app/                 # Main application screens using Expo Router
│   ├── (tabs)/          # Tab navigator screens
│   ├── modal.tsx        # Transaction entry modal
│   └── login.tsx        # Authentication screen
├── components/          # Reusable UI components
├── constants/           # App constants and theme configuration
├── context/             # React Context providers
│   ├── AuthContext.tsx  # Authentication state management
│   ├── NetworkContext.tsx # Network connectivity management
│   └── TransactionContext.tsx # Transaction data handling
├── utils/               # Utility functions
│   └── firebase.ts      # Firebase configuration
└── README.md            # Project documentation
```

## Key Functionalities

### Authentication

The app uses Firebase Authentication for user management, allowing users to:
- Create an account
- Log in securely
- Delete their account with all associated data

### Transaction Management

Users can:
- Add income and expense transactions
- Categorize transactions (groceries, dining, transport, etc.)
- View transaction history
- Filter transactions by type (income/expense)

### Offline Support

One of the key features is robust offline support:
- Transactions created offline are stored locally
- When connectivity is restored, data is automatically synchronized with the cloud
- Local data is prioritized for immediate UI updates

### Data Synchronization

The app implements a sophisticated synchronization system:
- Conflict resolution when the same transaction exists locally and in the cloud
- Duplicate prevention, especially for income transactions
- Background synchronization when network connectivity changes

## Development Notes

### State Management

The app uses React Context API for state management with three main contexts:
- `AuthContext`: Handles user authentication state
- `TransactionContext`: Manages transaction data and synchronization
- `NetworkContext`: Tracks network connectivity status

### Firebase Integration

- Authentication is configured with AsyncStorage persistence
- Firestore is used for storing transaction data
- Transactions are synchronized bidirectionally between local storage and Firestore

### Offline-First Approach

The app is designed with an offline-first approach:
- All data is stored locally first
- UI is updated immediately with local data
- Data is synchronized with the cloud when possible
- Network status changes trigger appropriate synchronization