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
}

export function getSharedSettings() {
  return sharedSettings;
}
