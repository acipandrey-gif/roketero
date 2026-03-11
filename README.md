# Raketero - Local Setup Guide

This project was built using **Google AI Studio Build**. To run this application locally in **VS Code**, follow these steps.

## Prerequisites

- **Node.js**: Install Node.js (v18 or higher recommended) from [nodejs.org](https://nodejs.org/).
- **VS Code**: Download and install [Visual Studio Code](https://code.visualstudio.com/).

## Getting Started

1. **Extract the Files**: If you downloaded this as a ZIP, extract it to a folder on your computer.
2. **Open in VS Code**: Open VS Code, go to `File > Open Folder...`, and select the project folder.
3. **Install Dependencies**:
   Open the integrated terminal in VS Code (`Ctrl+` ` or `Terminal > New Terminal`) and run:
   ```bash
   npm install
   ```

## Configuration

### Firebase Setup
This app uses Firebase for Authentication and Firestore.
1. Go to the [Firebase Console](https://console.firebase.com/).
2. Create a new project (or use an existing one).
3. Add a **Web App** to your project.
4. Copy the Firebase configuration object.
5. Update the `firebase-applet-config.json` file in the root directory with your project's details:
   ```json
   {
     "projectId": "your-project-id",
     "appId": "your-app-id",
     "apiKey": "your-api-key",
     "authDomain": "your-project-id.firebaseapp.com",
     "firestoreDatabaseId": "(default)",
     "storageBucket": "your-project-id.firebasestorage.app",
     "messagingSenderId": "your-sender-id"
   }
   ```
6. **Enable Authentication**: In the Firebase Console, enable **Email/Password**, **Google**, and **Facebook** sign-in providers.
7. **Enable Firestore**: Create a Firestore database in your project.
8. **Deploy Rules**: Copy the content of `firestore.rules` and paste it into the **Rules** tab of your Firestore database in the Firebase Console.

### Environment Variables
1. Create a `.env` file in the root directory (copy from `.env.example`).
2. Add your **Gemini API Key**:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Running the App

To start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## Recommended VS Code Extensions

- **Tailwind CSS IntelliSense**: For better CSS autocomplete.
- **ESLint**: For code linting.
- **Prettier**: For code formatting.
