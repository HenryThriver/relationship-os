import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Delete email artifacts for Ronen to test fresh email processing
    const { data: deletedEmails, error: deleteError } = await supabase
      .from('artifacts')
      .delete()
      .eq('type', 'email')
      .eq('contact_id', '03df0988-4cc8-44bc-b9af-3abf0342760c')
      .select('id'); // Return the IDs of deleted artifacts

    if (deleteError) {
      console.error('Error deleting email artifacts:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete email artifacts', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedEmails?.length || 0} email artifacts for Ronen`,
      deletedIds: deletedEmails?.map(email => email.id) || []
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 