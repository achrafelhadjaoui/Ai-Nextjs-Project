import { NextResponse } from 'next/server';
import { updateSharedSettings } from '../shared-settings';

export async function POST() {
  // Manually update with your actual data
  updateSharedSettings({
    savedReplies: [
      { title: 'Portfolio', content: 'hello portfolio' },
      { title: 'Saved testt', content: 'Saved testtSaved testtSaved testtSaved testt' },
      { title: 'yoo', content: 'jknljknkljn' }
    ],
    aiInstructions: 'Always read the full conversation before drafting a reply. Never answer out of context.\nUse line breaks to keep replies clean, easy to read, and professional.\n 5years experience.\nIf the Last message is sent by me, the reply should be follow up mostly\n ask him about what style he is looking for and examples.\n I\'ll start your first draft.'
  });
  
  return NextResponse.json({
    message: 'Manual update completed',
    settings: updateSharedSettings
  });
}
