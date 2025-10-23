# NoBrokerage.com - AI Engineer Intern Task

This is an intelligent, GPT-like chat interface that understands natural language queries about real estate and responds with a factual summary and a list of relevant properties from a CSV database.

**Live Demo Link:** [Insert your Vercel/Netlify link here - *optional but recommended*]

---

## 🚀 Project Goal

The goal was to build a Chat + Search system to help users discover properties using natural language instead of traditional filters. The AI parses user queries, extracts filters, searches a local CSV dataset, and generates a grounded summary of the results.

## ⚙️ Tech Stack

* **Framework:** Next.js (React)
* **Backend:** Next.js API Routes
* **Language:** TypeScript
* **AI / NLP:** Google Gemini Pro
* **Data Store:** In-memory JSON store loaded from CSVs (`csv-parser`)
* **Styling:** Tailwind CSS
* **UI:** React (`useState`)

## ✨ Core Features

* **Natural Language Query Understanding:** Parses queries like "3BHK in Pune under 1.2 Cr" into JSON filters (`{ "bhk": 3, "city": "Pune", "budget": 12000000 }`).
* **CSV Data Retrieval:** Filters an in-memory database loaded from 4 local CSV files.
* **Grounded Summarization:** Generates a 2-4 sentence summary *only* using the filtered CSV data, with no hallucination.
* **Dynamic Property Cards:** Displays matching properties in a clean, scrollable horizontal list.
* **ChatGPT-like UI:** A clean, responsive chat interface.

## Setup & Run Local

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/](https://github.com/)[your-username]/[your-repo-name].git
    cd [your-repo-name]
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    * Create a file named `.env.local` in the root.
    * Add your Google API key (see `.env.example`):
        ```
        GOOGLE_API_KEY=YOUR_API_KEY_HERE
        ```

4.  **Add your data:**
    * Place your CSV files (e.g., `project.csv`) inside the `/data` folder.
    * **Important:** You may need to update the `Project` interface in `/lib/data-loader.ts` to match your exact CSV columns.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to see the application.