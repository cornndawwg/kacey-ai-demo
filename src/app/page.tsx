'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    
    try {
      const response = await fetch('/api/seed-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSeedResult(`âœ… Database seeded successfully! You can now log in with:
        
Admin: admin@kacey-ai.com / admin123
Employee: employee@kacey-ai.com / admin123`);
      } else {
        setSeedResult(`âŒ Error: ${data.error}`);
      }
    } catch (error) {
      setSeedResult(`âŒ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              KaCey AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Knowledge Continuity AI
            </p>
            <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
              Capture, preserve, and transfer institutional knowledge through intelligent 
              AI-powered interviews and knowledge management. Ensure smooth transitions 
              when key personnel leave or retire.
            </p>
            
            {/* Database Setup Section */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ðŸš€ First Time Setup
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Before you can sign in, you need to seed the database with demo data.
              </p>
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSeeding ? 'Seeding Database...' : 'Seed Database'}
              </button>
              
              {seedResult && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md text-sm text-left">
                  <pre className="whitespace-pre-wrap">{seedResult}</pre>
                </div>
              )}
            </div>

            <div className="space-x-4">
              <Link
                href="/auth/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-white hover:bg-gray-50 text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium border-2 border-indigo-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
