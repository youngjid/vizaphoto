# ✨ VizaPhoto (v0.6.0) ✨

<p align="center"><img src="public/assets/brand/logo - readme.png" alt="VizaPhoto Logo" width="150"></p>

Vizaphoto is a web application designed to help users easily format photos to meet the specific requirements for various official documents like visas, passports, and ID cards for different countries 🌍.

## 🚀 Features

*   **Country & Document Selection 🗺️:** Choose your target country and the specific document type.
*   **Photo Upload ⬆️:** Upload your existing photo.
*   **AI-Powered Alignment 🤖:** Automatic face detection and guideline placement for easy cropping.
*   **Manual Adjustment 🔧:** Fine-tune zoom, rotation, and guideline positions.
*   **Background Processing 🎨:** (Functionality may vary - potentially background replacement/color adjustment).
*   **Digital Download 💻:** Get a compliant digital photo file.
*   **4x6 Print Layout 🖼️:** Generate a print-ready 4x6 inch sheet with the maximum number of photos arranged correctly, including cutting guides.

## 🛠️ Tech Stack

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **UI:** React
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui
*   **(Client-side AI):** face-api.js (for face detection/landmarks)

## 🏁 Getting Started (Local Development)

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd vizaphoto
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
    *Note: `npm ci` is recommended for cleaner installs if a `package-lock.json` exists.*

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser 🔥.

## 🛣️ Future Roadmap

Future plans include enhancing compliance checks, adding more print options (like PDF and different paper sizes), potentially integrating with print services, implementing user accounts, and more. A more detailed roadmap may be available separately. 