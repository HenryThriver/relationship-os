import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(): Promise<NextResponse> {
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

    // Since we're deleting all emails for this contact, we don't need to filter by email address
    const emailsToDelete = deletedEmails?.map((email: { id: string }) => email.id) || [];

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedEmails?.length || 0} email artifacts for Ronen`,
      deletedIds: emailsToDelete
    });

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Unexpected error occurred', details: errorMessage },
      { status: 500 }
    );
  }
} 