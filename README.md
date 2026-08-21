# Soprema Commercial Roof Builder

A professional, interactive web application for designing, analyzing, and estimating commercial roofing assemblies using official Soprema products. 

## ✨ Key Features

### 🏗️ Interactive Assembly Visualizer
* Build roof assemblies layer-by-layer (Vapor Barriers, Insulation, Coverboards, Base Plys, Cap Sheets, and Adhesives).
* Dynamic 3D/Stack visualization of the configured roof system.

### 📚 Comprehensive Product Database
* Includes over 30 official Soprema commercial roofing materials.
* Contains highly detailed technical specifications (R-Value, compressive strength, elongation, VOC content, etc.).
* Tracks environmental and structural certifications (LEED Eligible, FM Approved, Energy Star, CRRC Listed).
* Direct hyperlinks to official Soprema technical product pages.

### ⚖️ Side-by-Side Product Comparison
* Select up to two materials from the catalog to compare them side-by-side.
* High-contrast modal breaks down pricing, coverage, technical specifications, and certifications to assist in engineering decisions.

### 💾 Project Management & State Saving
* **Save & Load**: Save multiple project configurations locally.
* **Visual Thumbnails**: Automatically captures a snapshot of the visualizer using `html2canvas` to create a preview thumbnail for each saved project.
* **Load Dashboard**: Browse your saved assemblies via a clean modal interface displaying the project name, date, layer count, and visual preview.

### 📤 Bill of Materials (BOM) & PDF Export
* Real-time calculation of pricing, coverage, and total material requirements based on the roof area and waste factor.
* Export the complete BOM and assembly snapshot to a professional PDF document.
* Polished toast notifications (via `sonner`) guide the user through the background generation process.

### 🔗 Secure URL Sharing
* Share configurations instantly via encoded URL parameters.
* **Hardened Security**: Features a robust sanitization engine that strictly validates and filters incoming URL payloads, preventing Cross-Site Scripting (XSS) and prototype pollution attacks. Malicious links are automatically neutralized by cross-referencing injected layers against the immutable internal product database.

## 🛠️ Technology Stack

* **Frontend Framework**: React 18
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Build Tool**: Vite
* **Icons**: Lucide React
* **Notifications**: Sonner
* **Export & Imaging**: jsPDF, html2canvas

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```
