// Shared settings storage for the API
export let sharedSettings = {
  savedReplies: [],
  aiInstructions: ''
};

export function updateSharedSettings(newSettings: { savedReplies: any[], aiInstructions: string }) {
  sharedSettings = {
    savedReplies: newSettings.savedReplies || [],
    aiInstructions: newSettings.aiInstructions || ''
  };
  console.log('🔄 Shared settings updated:', sharedSettings);
  console.log('🔄 Number of saved replies:', sharedSettings.savedReplies.length);
}

export function getSharedSettings() {
  return sharedSettings;
}
