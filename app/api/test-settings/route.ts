import { NextResponse } from 'next/server';
import { getSharedSettings, updateSharedSettings } from '../shared-settings';

export async function GET() {
  const settings = getSharedSettings();
  return NextResponse.json({
    sharedSettings: settings,
    message: 'Current shared settings'
  });
}

export async function POST() {
  // Test update
  updateSharedSettings({
    savedReplies: [
      { title: 'Test Reply', content: 'This is a test reply' }
    ],
    aiInstructions: 'Test instructions'
  });
  
  return NextResponse.json({
    message: 'Test settings updated',
    settings: getSharedSettings()
  });
}
