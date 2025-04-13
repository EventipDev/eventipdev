import { NextResponse } from 'next/server';
import { processAutomaticPayouts } from '../../../../lib/paymentUtils';

// This is an API route that would be called by a scheduler/cron job
// e.g., Vercel Cron Jobs, AWS Lambda, etc.
export async function GET(request) {
  try {
    // Check for authorization - in production, you'd implement a more secure auth method
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Process payouts
    const results = await processAutomaticPayouts();
    
    return NextResponse.json(
      { 
        success: true,
        message: `Processed ${results.processed} payment requests`,
        results: results.results 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing automatic payouts:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Optional: Handle POST requests if needed
export async function POST(request) {
  return GET(request);
} 