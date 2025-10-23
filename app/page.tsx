// In /app/page.tsx
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Modal from 'react-modal';
import { FullProperty } from '@/lib/data-loader';
import { motion, AnimatePresence } from 'framer-motion';

// --- Message Interface ---
interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

// --- Set Modal App Element ---
if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

// --- Price Formatter ---
const formatPrice = (price: number) => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  return `₹${(price / 100000).toFixed(2)} L`;
};

// --- PropertyCard Component ---
function PropertyCard({ project, onClick }: { project: FullProperty, onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-lg flex-shrink-0 w-72 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all"
      onClick={onClick}
    >
      <h3 className="font-bold text-lg text-blue-400">{project.projectName}</h3>
      <p className="text-gray-300 text-sm">{project.fullAddress.split(',').slice(0, 2).join(', ')}</p>
      <div className="mt-2">
        <span className="font-semibold text-gray-100">{formatPrice(project.price)}</span>
        <span className="text-gray-500 mx-2">|</span>
        <span className="font-semibold text-gray-100">{project.bhk}</span>
      </div>
      <p className={`mt-1 text-sm ${project.status === 'Ready' ? 'text-green-400' : 'text-yellow-400'}`}>
        {project.status}
      </p>
    </motion.div>
  );
}

// --- Main Home Component ---
export default function Home() {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [properties, setProperties] = useState<FullProperty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FullProperty | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputQuery
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);
    setProperties([]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputQuery }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      const modelMessage: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.summary
      };
      setMessages(prev => [...prev, modelMessage]);
      setProperties(data.properties);

    } catch (error) {
      console.error('There was an error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: 'Sorry, I ran into an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (project: FullProperty) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // --- Animation variant ---
  // THIS IS THE FIX: Added `as const` to prevent TypeScript error
  const messageAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  } as const; // <-- THE FIX IS HERE

  return (
    <main className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 shadow-md p-4">
        <h1 className="text-2xl font-bold text-center text-blue-400">
          NoBrokerage.com AI Assistant
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                {...messageAnimation}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-lg max-w-lg shadow-md ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                    }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              layout
              {...messageAnimation}
              className="flex justify-start"
            >
              <div className="p-3 rounded-lg bg-gray-700 text-gray-400 italic shadow-md">
                Thinking...
              </div>
            </motion.div>
          )}
        </div>

        {properties.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4"
          >
            <h2 className="text-lg font-semibold text-gray-200 mb-2">
              Matching Properties
            </h2>
            <div className="flex overflow-x-auto space-x-4 pb-4">
              <AnimatePresence>
                {properties.map((project) => (
                  <PropertyCard
                    key={project.id}
                    project={project}
                    onClick={() => openModal(project)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      <footer className="bg-gray-800 border-t border-gray-700 p-4 shadow-inner">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about properties... (e.g., 3BHK in Pune under 1.2 Cr)"
            className="flex-1 p-3 border border-gray-600 rounded-lg text-gray-100 bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 disabled:bg-gray-500 transition-colors"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </footer>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Property Details"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-gray-100 rounded-lg shadow-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto border border-gray-700"
        overlayClassName="fixed inset-0 bg-black bg-opacity-70"
      >
        {selectedProject && (
          <div>
            <div className="flex justify-between items-center border-b border-gray-600 pb-3">
              <h2 className="text-2xl font-bold text-blue-400">{selectedProject.projectName}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white text-3xl">&times;</button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-200">Key Details</h3>
                <p><strong>Price:</strong> {formatPrice(selectedProject.price)}</p>
                <p><strong>Type:</strong> {selectedProject.bhk}</p>
                <p><strong>Status:</strong> {selectedProject.status}</p>
                <p><strong>Address:</strong> {selectedProject.fullAddress}</p>
                <p><strong>Carpet Area:</strong> {selectedProject.carpetArea}</p>
                <p><strong>Bathrooms:</strong> {selectedProject.bathrooms}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-200">About Property</h3>
                <p className="text-gray-300">{selectedProject.aboutProperty}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-200">Images</h3>
              {selectedProject.floorPlanImage && (
                <img
                  src={selectedProject.floorPlanImage}
                  alt="Floor Plan"
                  className="w-full rounded-lg border border-gray-600 mb-4"
                />
              )}
              <div className="flex overflow-x-auto space-x-2">
                {selectedProject.propertyImages.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`Property Image ${index + 1}`}
                    className="h-32 rounded border border-gray-600"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}