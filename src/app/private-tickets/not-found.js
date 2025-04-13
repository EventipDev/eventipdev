import Link from 'next/link';

export default function PrivateTicketNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="text-red-500 text-5xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Private Ticket Not Found</h1>
        <p className="text-slate-600 mb-6">
          The ticket you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Return Home
        </Link>
      </div>
    </div>
  );
} 