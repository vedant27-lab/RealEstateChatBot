// In /app/page.tsx
'use client'; // This is a client component, as it needs state and interactivity

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Project } from '@/lib/data-loader'; // Import our Project type

// Define the structure for a single chat message
interface Message {
  role: 'user' | 'model';
  content: string;
}

// A simple component to render the property cards
// We could move this to its own file (e.g., /app/components/PropertyCard.tsx)
// but for simplicity in a 3-day project, keeping it here is fine.
function PropertyCard({ project }: { project: Project }) {
  
  // A helper to format the price
  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(2)} L`;
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm flex-shrink-0 w-72">
      <h3 className="font-bold text-lg text-blue-800">{project.projectName}</h3>
      <p className="text-gray-700">{project.locality}, {project.city}</p>
      <div className="mt-2">
        <span className="font-semibold">{formatPrice(project.price)}</span>
        <span className="text-gray-600 mx-2">|</span>
        <span className="font-semibold">{project.bhk} BHK</span>
      </div>
      <p className={`mt-1 text-sm ${project.possessionStatus === 'Ready' ? 'text-green-600' : 'text-yellow-600'}`}>
        {project.possessionStatus}
      </p>
      {/* You could add a placeholder for amenities here */}
      {/* <p className="text-xs text-gray-500 mt-2">Amenities: Gym, Pool...</p> */}
    </div>
  );
}


// This is our main page component
export default function Home() {
  // --- State Variables ---

  // Stores the user's current message in the input box
  const [inputQuery, setInputQuery] = useState('');

  // Stores the list of all messages for rendering the chat history
  const [messages, setMessages] = useState<Message[]>([]);

  // Stores the list of properties returned from the API
  const [properties, setProperties] = useState<Project[]>([]);

  // A simple flag to show a "thinking..." message
  const [isLoading, setIsLoading] = useState(false);

  // --- Form Submission Logic ---
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Stop the page from reloading
    if (!inputQuery.trim()) return; // Don't send empty messages

    const userMessage: Message = { role: 'user', content: inputQuery };
    
    // Add user's message to chat and clear input
    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);
    setProperties([]); // Clear old properties

    try {
      // Call our own backend API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputQuery }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Add the AI's summary to the chat
      const modelMessage: Message = { role: 'model', content: data.summary };
      setMessages(prev => [...prev, modelMessage]);

      // Set the property results to be displayed
      setProperties(data.properties);

    } catch (error) {
      console.error('There was an error:', error);
      const errorMessage: Message = { 
        role: 'model', 
        content: 'Sorry, I ran into an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX for Rendering ---

  return (
    <main className="flex flex-col h-screen bg-gray-100">
      
      {/* Header */}
      <header className="bg-white border-b shadow-sm p-4">
        <h1 className="text-2xl font-bold text-center text-blue-900">
          NoBrokerage.com AI Assistant
        </h1>
      </header>

      {/* Main Content Area (Chat + Results) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        
        {/* Chat Messages */}
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`p-3 rounded-lg max-w-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-800 border'
                }`}
              >
                {/* We use ReactMarkdown to safely render the AI's response */}
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-lg bg-white text-gray-500 border italic">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Property Card Results */}
        {/* We only show this section if there are properties to display */}
        {properties.length > 0 && (
          <div className="pt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Matching Properties
            </h2>
            {/* This makes the cards scroll horizontally */}
            <div className="flex overflow-x-auto space-x-4 pb-4">
              {properties.map((project) => (
                <PropertyCard key={project.projectId} project={project} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Input Form at the bottom */}
      <footer className="bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about properties... (e.g., 3BHK in Pune under 1.2 Cr)"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md
                       hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </footer>
    </main>
  );
}