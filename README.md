# Soprema Roof System Builder

A professional, interactive 3D web application for visualizing, designing, and calculating commercial roofing assemblies. 

## 🌟 Key Features

* **Interactive 3D Visualizer:** Build roof systems layer by layer with a dynamic, rotatable 3D stack. Features drag-and-drop reordering, zoom controls, and detailed material tooltips.
* **Dynamic Weather Simulation:** Toggle real-time rain and snow particle effects directly within the visualizer environment, complete with adjustable intensity sliders.
* **Cloud Synchronization:** Secure user authentication and project cloud-saving powered by Firebase Auth and Firestore. Access your roof designs from any device.
* **Real-time Calculations:** Instantly calculate total estimated weight based on assembly layers, area size, and unit systems (Imperial/Metric).
* **Export & Share:** Export complete project assemblies to JSON, or generate a QR code for quick mobile sharing and presentations.

## 🛠 Tech Stack

* **Frontend Framework:** React 19 with TypeScript, built on Vite.
* **Styling:** Tailwind CSS for a modern, responsive, and highly customized UI.
* **Animations:** Framer Motion (`motion/react`) for fluid layer transitions and drag-and-drop interactions.
* **Weather Engine:** Custom HTML5 Canvas API for high-performance weather particle rendering.
* **Backend & Auth:** Firebase (Firestore & Authentication).
* **Icons:** Lucide React.

## 📁 Project Structure

* `/src/components/Visualizer.tsx`: The core 3D interactive rendering engine and drag-and-drop interface.
* `/src/components/WeatherOverlay.tsx`: HTML5 Canvas implementation of the rain and snow particle systems.
* `/src/components/Header.tsx`: Application toolbar containing tools for exporting, saving, unit toggling, and authentication.
* `/src/lib/firebase.ts`: Firebase configuration and initialization logic.
* `/src/types.ts`: TypeScript interfaces for materials, layers, and roof parameters.

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* A Firebase Project (for Auth and Firestore)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_ID=your_firestore_db_id
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## 🔒 Security Note
Firebase configuration variables (`VITE_FIREBASE_*`) are safe to expose in client-side code as they are used to identify your project to Google servers. However, ensure that your Firestore Security Rules (`firestore.rules`) are properly configured to prevent unauthorized data access, and restrict your Firebase API Key usage to your production domains within the Google Cloud Console.
