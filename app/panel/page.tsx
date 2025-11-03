// 'use client';

// import DashboardLayout from '@/components/DashboardLayout';
// import { Settings, Globe, Eye, EyeOff, Plus, Trash2, Upload, Download, Save } from 'lucide-react';
// import { useState, useEffect } from 'react';

// export default function PanelPage() {
//   // Default settings
//   const defaultSettings = {
//     // Extension Activation
//     enableOnAllSites: true,
//     allowedSites: ['fiverr', 'upwork', 'freelancer'],
    
//     // AI Agent Settings
//     useNameSignature: false,
//     agentName: '',
//     useLineSpacing: true,
//     useToneSettings: true,
//     agentTone: 'friendly',
//     useOpenAI: true,
//     openaiKey: '',
    
//     // Instructions
//     instructions: [],
    
//     // Quick Replies
//     quickReplies: [],
//     panelMinimized: false,
//     quickReplyOrder: [],
//     quickReplyUsage: {}
//   };

//   // Load settings from localStorage or use defaults
//   const [settings, setSettings] = useState(defaultSettings);
//   const [isLoaded, setIsLoaded] = useState(false);

//   const [showApiKey, setShowApiKey] = useState(false);
//   const [newInstruction, setNewInstruction] = useState('');
//   const [newQuickReply, setNewQuickReply] = useState({ title: '', text: '' });
//   const [showAddInstruction, setShowAddInstruction] = useState(false);
//   const [showAddQuickReply, setShowAddQuickReply] = useState(false);
//   const [editingInstruction, setEditingInstruction] = useState(null);
//   const [editingQuickReply, setEditingQuickReply] = useState(null);
//   const [searchInstructions, setSearchInstructions] = useState('');
//   const [searchQuickReplies, setSearchQuickReplies] = useState('');
//   const [newKeyword, setNewKeyword] = useState('');
//   const [editingKeyword, setEditingKeyword] = useState(null);
//   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
//   const [initialSettings, setInitialSettings] = useState(null);

//   // Load settings from localStorage on client side only
//   useEffect(() => {
//     const saved = localStorage.getItem('farisly-settings');
//     if (saved) {
//       try {
//         const parsedSettings = JSON.parse(saved);
//         setSettings({ ...defaultSettings, ...parsedSettings });
//       } catch (error) {
//         console.error('Error parsing saved settings:', error);
//         setSettings(defaultSettings);
//       }
//     }
//     setIsLoaded(true);
//   }, []);

//   const handleSettingChange = (key: string, value: any) => {
//     setSettings(prev => ({ ...prev, [key]: value }));
//   };

//   console.log("this is settings: ", settings.quickReplies)

//   // Track changes to enable/disable save button
//   useEffect(() => {
//     if (isLoaded) {
//       if (initialSettings) {
//         const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);
//         setHasUnsavedChanges(hasChanges);
//       } else {
//         // Set initial settings on first load
//         setInitialSettings(JSON.parse(JSON.stringify(settings)));
//       }
//     }
//   }, [settings, initialSettings, isLoaded]);

//   // Auto-save settings to localStorage when they change (optional)
//   useEffect(() => {
//     if (isLoaded && initialSettings && typeof window !== 'undefined') {
//       localStorage.setItem('farisly-settings', JSON.stringify(settings));
//     }
//   }, [settings, initialSettings, isLoaded]);

//   const handleSave = async () => {
//     if (!hasUnsavedChanges) return;
    
//     // Save settings to localStorage
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('farisly-settings', JSON.stringify(settings));
//     }
    
//     // Save to extension storage
//     try {
//       // Save API key to extension
//       if (settings.openaiKey) {
//         await fetch('http://localhost:3000/api/extension/set-api-key', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ apiKey: settings.openaiKey })
//         });
//       }
//       // Save settings to extension
//       await fetch('http://localhost:3000/api/extension/set-settings', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           savedReplies: settings.quickReplies.map(qr => ({
//             title: qr.title,
//             content: qr.text
//           })),
//           aiInstructions: settings.instructions
//             .filter(inst => inst.enabled)
//             .map(inst => inst.text)
//             .join('\n')
//         })
//       });
//       console.log('Settings saved to extension:', settings);
//     } catch (error) {
//       console.error('Error saving to extension:', error);
//     }
    
//     // Update state to reflect saved settings
//     setInitialSettings(JSON.parse(JSON.stringify(settings)));
//     setHasUnsavedChanges(false);
//   };

//   // Keyword management functions
//   const addKeyword = () => {
//     const keyword = newKeyword.trim().toLowerCase();
//     if (keyword && !settings.allowedSites.includes(keyword)) {
//       handleSettingChange('allowedSites', [...settings.allowedSites, keyword]);
//       setNewKeyword('');
//     }
//   };

//   const removeKeyword = (index: number) => {
//     handleSettingChange('allowedSites', settings.allowedSites.filter((_, i) => i !== index));
//   };

//   const updateKeyword = (index: number, newValue: string) => {
//     const keyword = newValue.trim().toLowerCase();
//     if (keyword && !settings.allowedSites.includes(keyword)) {
//       handleSettingChange('allowedSites', settings.allowedSites.map((k, i) => i === index ? keyword : k));
//     }
//     setEditingKeyword(null);
//   };

//   const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       addKeyword();
//     }
//   };

//   const addInstruction = () => {
//     if (newInstruction.trim()) {
//       const instruction = {
//         id: Date.now().toString(),
//         text: newInstruction.trim(),
//         enabled: true,
//         createdAt: new Date().toISOString()
//       };
//       handleSettingChange('instructions', [...settings.instructions, instruction]);
//       setNewInstruction('');
//       setShowAddInstruction(false);
//     }
//   };

//   const addQuickReply = () => {
//     if (newQuickReply.title.trim() && newQuickReply.text.trim()) {
//       const quickReply = {
//         key: newQuickReply.title.toLowerCase().replace(/\s+/g, '_').slice(0, 40),
//         title: newQuickReply.title.trim(),
//         text: newQuickReply.text.trim()
//       };
//       handleSettingChange('quickReplies', [...settings.quickReplies, quickReply]);
//       setNewQuickReply({ title: '', text: '' });
//       setShowAddQuickReply(false);
//     }
//   };

//   const filteredInstructions = settings.instructions.filter(inst =>
//     inst.text.toLowerCase().includes(searchInstructions.toLowerCase())
//   );

//   const filteredQuickReplies = settings.quickReplies.filter(qr =>
//     qr.title.toLowerCase().includes(searchQuickReplies.toLowerCase()) ||
//     qr.text.toLowerCase().includes(searchQuickReplies.toLowerCase())
//   );

//   // Show loading state until settings are loaded
//   if (!isLoaded) {
//     return (
//       <DashboardLayout>
//         <div className="p-8 flex items-center justify-center min-h-screen">
//           <div className="text-white">Loading settings...</div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout>
//       <div className="p-8">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-white mb-2">Settings Panel</h1>
//           <p className="text-gray-400">Manage your Farisly AI extension settings</p>
//         </div>

//         {/* Sticky Save Button */}
//         <div className="fixed top-4 right-8 z-50">
//           <button
//             onClick={handleSave}
//             disabled={!hasUnsavedChanges}
//             className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
//               hasUnsavedChanges
//                 ? 'bg-white text-black hover:bg-gray-100 shadow-lg'
//                 : 'bg-gray-700 text-gray-400 cursor-not-allowed shadow-md'
//             }`}
//           >
//             <Save className="w-4 h-4" />
//             {hasUnsavedChanges ? 'Save Settings' : 'No Changes'}
//           </button>
//         </div>

//         {/* Settings Sections */}
//         <div className="space-y-6">
//           {/* Extension Activation */}
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="flex items-center gap-3 mb-6">
//               <Globe className="w-5 h-5 text-white" />
//               <h3 className="text-lg font-semibold text-white">Extension Activation</h3>
//             </div>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between py-3 border-b border-gray-800">
//                 <div>
//                   <div className="text-white text-sm font-medium mb-1">Enable on all sites</div>
//                   <div className="text-gray-400 text-xs">Show extension on all websites</div>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     className="sr-only peer"
//                     checked={settings.enableOnAllSites}
//                     onChange={(e) => handleSettingChange('enableOnAllSites', e.target.checked)}
//                   />
//                   <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
//                 </label>
//               </div>
              
//               {!settings.enableOnAllSites && (
//                 <div className="py-3">
//                   <label className="block text-white text-sm font-medium mb-2">
//                     Allowed Sites Keywords
//                   </label>
//                   <div className="min-h-[80px] p-3 bg-[#0a0a0a] border border-gray-800 rounded-lg">
//                     <div className="flex flex-wrap gap-2 mb-3">
//                       {settings.allowedSites.map((keyword, index) => (
//                         <div
//                           key={index}
//                           className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 border border-gray-600 rounded-full text-white text-sm"
//                         >
//                           {editingKeyword === index ? (
//                             <input
//                               type="text"
//                               defaultValue={keyword}
//                               onBlur={(e) => updateKeyword(index, e.target.value)}
//                               onKeyDown={(e) => {
//                                 if (e.key === 'Enter') {
//                                   updateKeyword(index, e.target.value);
//                                 } else if (e.key === 'Escape') {
//                                   setEditingKeyword(null);
//                                 }
//                               }}
//                               className="bg-transparent text-white text-sm border-none outline-none min-w-[60px]"
//                               autoFocus
//                             />
//                           ) : (
//                             <>
//                               <span
//                                 className="cursor-pointer hover:text-gray-300"
//                                 onClick={() => setEditingKeyword(index)}
//                               >
//                                 {keyword}
//                               </span>
//                               <button
//                                 onClick={() => removeKeyword(index)}
//                                 className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
//                               >
//                                 ×
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                     <input
//                       type="text"
//                       value={newKeyword}
//                       onChange={(e) => setNewKeyword(e.target.value)}
//                       onKeyDown={handleKeywordKeyDown}
//                       onBlur={() => {
//                         if (newKeyword.trim()) {
//                           addKeyword();
//                         }
//                       }}
//                       placeholder="Type keyword and press Enter..."
//                       className="w-full px-3 py-2 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none text-sm"
//                     />
//                   </div>
//                   <p className="text-xs text-gray-400 mt-1">Enter keywords that should be present in the URL (e.g., "fiverr", "upwork")</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* AI Agent Settings */}
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="flex items-center gap-3 mb-6">
//               <Settings className="w-5 h-5 text-white" />
//               <h3 className="text-lg font-semibold text-white">AI Agent Settings</h3>
//             </div>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between py-3 border-b border-gray-800">
//                 <div>
//                   <div className="text-white text-sm font-medium mb-1">Use name signature</div>
//                   <div className="text-gray-400 text-xs">Add your name at the end of messages</div>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     className="sr-only peer"
//                     checked={settings.useNameSignature}
//                     onChange={(e) => handleSettingChange('useNameSignature', e.target.checked)}
//                   />
//                   <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
//                 </label>
//               </div>

//               {settings.useNameSignature && (
//                 <div className="py-3 border-b border-gray-800">
//                   <label className="block text-white text-sm font-medium mb-2">Agent Name</label>
//                   <input
//                     type="text"
//                     value={settings.agentName}
//                     onChange={(e) => handleSettingChange('agentName', e.target.value)}
//                     placeholder="Your name"
//                     className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
//                   />
//                 </div>
//               )}

//               <div className="flex items-center justify-between py-3 border-b border-gray-800">
//                 <div>
//                   <div className="text-white text-sm font-medium mb-1">Use line spacing</div>
//                   <div className="text-gray-400 text-xs">Add proper paragraph breaks for readability</div>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     className="sr-only peer"
//                     checked={settings.useLineSpacing}
//                     onChange={(e) => handleSettingChange('useLineSpacing', e.target.checked)}
//                   />
//                   <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between py-3 border-b border-gray-800">
//                 <div>
//                   <div className="text-white text-sm font-medium mb-1">Use tone settings</div>
//                   <div className="text-gray-400 text-xs">Apply tone preferences to generated responses</div>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     className="sr-only peer"
//                     checked={settings.useToneSettings}
//                     onChange={(e) => handleSettingChange('useToneSettings', e.target.checked)}
//                   />
//                   <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
//                 </label>
//               </div>

//               {settings.useToneSettings && (
//                 <div className="py-3 border-b border-gray-800">
//                   <label className="block text-white text-sm font-medium mb-2">Agent Tone</label>
//                   <select
//                     value={settings.agentTone}
//                     onChange={(e) => handleSettingChange('agentTone', e.target.value)}
//                     className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-gray-700"
//                   >
//                     <option value="friendly">Friendly</option>
//                     <option value="professional">Professional</option>
//                     <option value="casual">Casual</option>
//                     <option value="formal">Formal</option>
//                   </select>
//                 </div>
//               )}

//               <div className="flex items-center justify-between py-3 border-b border-gray-800">
//                 <div>
//                   <div className="text-white text-sm font-medium mb-1">Use OpenAI</div>
//                   <div className="text-gray-400 text-xs">Enable AI-powered response generation</div>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     className="sr-only peer"
//                     checked={settings.useOpenAI}
//                     onChange={(e) => handleSettingChange('useOpenAI', e.target.checked)}
//                   />
//                   <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
//                 </label>
//               </div>

//               {settings.useOpenAI && (
//                 <div className="py-3">
//                   <label className="block text-white text-sm font-medium mb-2">OpenAI API Key</label>
//                   <div className="relative">
//                     <input
//                       type={showApiKey ? "text" : "password"}
//                       value={settings.openaiKey}
//                       onChange={(e) => handleSettingChange('openaiKey', e.target.value)}
//                       placeholder="sk-proj-..."
//                       className="w-full px-3 py-2 pr-10 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowApiKey(!showApiKey)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
//                     >
//                       {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Instructions */}
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-3">
//                 <Settings className="w-5 h-5 text-white" />
//                 <h3 className="text-lg font-semibold text-white">Custom Instructions</h3>
//               </div>
//               <button
//                 onClick={() => setShowAddInstruction(true)}
//                 className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Instruction
//               </button>
//             </div>

//             <div className="mb-4">
//               <input
//                 type="text"
//                 value={searchInstructions}
//                 onChange={(e) => setSearchInstructions(e.target.value)}
//                 placeholder="Search instructions..."
//                 className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
//               />
//             </div>

//             <div className="space-y-3 max-h-60 overflow-y-auto">
//               {filteredInstructions.map((instruction) => (
//                 <div key={instruction.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
//                   <input
//                     type="checkbox"
//                     checked={instruction.enabled}
//                     onChange={(e) => {
//                       const updated = settings.instructions.map(inst =>
//                         inst.id === instruction.id ? { ...inst, enabled: e.target.checked } : inst
//                       );
//                       handleSettingChange('instructions', updated);
//                     }}
//                     className="mt-1"
//                   />
//                   <div className="flex-1">
//                     <div className="text-white text-sm">{instruction.text}</div>
//                     <div className="text-xs text-gray-400 mt-1">
//                       Created: {new Date(instruction.createdAt).toLocaleDateString()}
//                     </div>
//                   </div>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => setEditingInstruction(instruction)}
//                       className="p-1 text-gray-400 hover:text-white transition-colors"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => {
//                         const updated = settings.instructions.filter(inst => inst.id !== instruction.id);
//                         handleSettingChange('instructions', updated);
//                       }}
//                       className="p-1 text-gray-400 hover:text-red-400 transition-colors"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {showAddInstruction && (
//               <div className="mt-4 p-4 bg-white/5 rounded-lg">
//                 <textarea
//                   value={newInstruction}
//                   onChange={(e) => setNewInstruction(e.target.value)}
//                   placeholder="Enter your instruction..."
//                   className="w-full h-20 px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 resize-none mb-3"
//                 />
//                 <div className="flex gap-2">
//                   <button
//                     onClick={addInstruction}
//                     className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
//                   >
//                     Add
//                   </button>
//                   <button
//                     onClick={() => {
//                       setShowAddInstruction(false);
//                       setNewInstruction('');
//                     }}
//                     className="px-4 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Quick Replies */}
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-3">
//                 <Settings className="w-5 h-5 text-white" />
//                 <h3 className="text-lg font-semibold text-white">Quick Replies</h3>
//               </div>
//               <button
//                 onClick={() => setShowAddQuickReply(true)}
//                 className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Reply
//               </button>
//             </div>

//             <div className="mb-4">
//               <input
//                 type="text"
//                 value={searchQuickReplies}
//                 onChange={(e) => setSearchQuickReplies(e.target.value)}
//                 placeholder="Search quick replies..."
//                 className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
//               />
//             </div>

//             <div className="space-y-3 max-h-60 overflow-y-auto">
//               {filteredQuickReplies.map((quickReply) => (
//                 <div key={quickReply.key} className="p-3 bg-white/5 rounded-lg">
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1">
//                       <div className="text-white text-sm font-medium mb-1">{quickReply.title}</div>
//                       <div className="text-gray-400 text-sm">{quickReply.text}</div>
//                     </div>
//                     <div className="flex gap-2 ml-4">
//                       <button
//                         onClick={() => setEditingQuickReply(quickReply)}
//                         className="p-1 text-gray-400 hover:text-white transition-colors"
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => {
//                           const updated = settings.quickReplies.filter(qr => qr.key !== quickReply.key);
//                           handleSettingChange('quickReplies', updated);
//                         }}
//                         className="p-1 text-gray-400 hover:text-red-400 transition-colors"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {showAddQuickReply && (
//               <div className="mt-4 p-4 bg-white/5 rounded-lg">
//                 <input
//                   type="text"
//                   value={newQuickReply.title}
//                   onChange={(e) => setNewQuickReply(prev => ({ ...prev, title: e.target.value }))}
//                   placeholder="Title"
//                   className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 mb-3"
//                 />
//                 <textarea
//                   value={newQuickReply.text}
//                   onChange={(e) => setNewQuickReply(prev => ({ ...prev, text: e.target.value }))}
//                   placeholder="Message content..."
//                   className="w-full h-20 px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 resize-none mb-3"
//                 />
//                 <div className="flex gap-2">
//                   <button
//                     onClick={addQuickReply}
//                     className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
//                   >
//                     Add
//                   </button>
//                   <button
//                     onClick={() => {
//                       setShowAddQuickReply(false);
//                       setNewQuickReply({ title: '', text: '' });
//                     }}
//                     className="px-4 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Panel Settings */}
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="flex items-center gap-3 mb-6">
//               <Settings className="w-5 h-5 text-white" />
//               <h3 className="text-lg font-semibold text-white">Panel Settings</h3>
//             </div>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between py-3 border-b border-gray-800">
//                 <div>
//                   <div className="text-white text-sm font-medium mb-1">Panel minimized by default</div>
//                   <div className="text-gray-400 text-xs">Start with the panel minimized</div>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     className="sr-only peer"
//                     checked={settings.panelMinimized}
//                     onChange={(e) => handleSettingChange('panelMinimized', e.target.checked)}
//                   />
//                   <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
//                 </label>
//               </div>
//             </div>
//           </div>

//           {/* Import/Export */}
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="flex items-center gap-3 mb-6">
//               <Settings className="w-5 h-5 text-white" />
//               <h3 className="text-lg font-semibold text-white">Import/Export</h3>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <h4 className="text-white text-sm font-medium">Instructions</h4>
//                 <div className="flex gap-2">
//                   <button className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
//                     <Upload className="w-4 h-4" />
//                     Import
//                   </button>
//                   <button className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
//                     <Download className="w-4 h-4" />
//                     Export
//                   </button>
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <h4 className="text-white text-sm font-medium">Quick Replies</h4>
//                 <div className="flex gap-2">
//                   <button className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
//                     <Upload className="w-4 h-4" />
//                     Import
//                   </button>
//                   <button className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
//                     <Download className="w-4 h-4" />
//                     Export
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }






'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { Settings, Globe, Eye, EyeOff, Plus, Trash2, Upload, Download, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { toast } from 'react-toastify';

export default function PanelPage() {
  // Default settings
  const defaultSettings = {
    // Extension Activation
    enableOnAllSites: true,
    allowedSites: [],
    
    // AI Agent Settings
    useNameSignature: false,
    agentName: '',
    useLineSpacing: true,
    useToneSettings: true,
    agentTone: 'friendly',
    useOpenAI: true,
    openaiKey: '',
    
    // Instructions
    instructions: [],
    
    // Quick Replies
    quickReplies: [],
    panelMinimized: false,
    quickReplyOrder: [],
    quickReplyUsage: {}
  };

  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const { t } = useI18n(); // Add this hook call

  const [showApiKey, setShowApiKey] = useState(false);
  const [newInstruction, setNewInstruction] = useState('');
  const [newQuickReply, setNewQuickReply] = useState({ title: '', text: '' });
  const [showAddInstruction, setShowAddInstruction] = useState(false);
  const [showAddQuickReply, setShowAddQuickReply] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState(null);
  const [editingQuickReply, setEditingQuickReply] = useState(null);
  const [searchInstructions, setSearchInstructions] = useState('');
  const [searchQuickReplies, setSearchQuickReplies] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialSettings, setInitialSettings] = useState(null);

  // Load settings from localStorage and user profile on client side only
  useEffect(() => {
    const loadSettings = async () => {
      // Load from localStorage first
      const saved = localStorage.getItem('farisly-settings');
      let localSettings = defaultSettings;

      if (saved) {
        try {
          const parsedSettings = JSON.parse(saved);
          localSettings = { ...defaultSettings, ...parsedSettings };
        } catch (error) {
          console.error('Error parsing saved settings:', error);
        }
      }

      // Load extension settings from user profile
      try {
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.data.extensionSettings) {
            localSettings = {
              ...localSettings,
              enableOnAllSites: profileData.data.extensionSettings.enableOnAllSites ?? true,
              allowedSites: profileData.data.extensionSettings.allowedSites ?? []
            };
            console.log('✅ Loaded extension settings from user profile');
          }
        }
      } catch (error) {
        console.error('Error loading extension settings from profile:', error);
      }

      setSettings(localSettings);
      setIsLoaded(true);
    };

    loadSettings();
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  console.log("Current settings state: ", settings);

  // Track changes to enable/disable save button
  useEffect(() => {
    if (isLoaded) {
      if (initialSettings) {
        const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);
        setHasUnsavedChanges(hasChanges);
      } else {
        // Set initial settings on first load
        setInitialSettings(JSON.parse(JSON.stringify(settings)));
      }
    }
  }, [settings, initialSettings, isLoaded]);

  // Auto-save settings to localStorage when they change (optional)
  useEffect(() => {
    if (isLoaded && initialSettings && typeof window !== 'undefined') {
      localStorage.setItem('farisly-settings', JSON.stringify(settings));
    }
  }, [settings, initialSettings, isLoaded]);

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;

    // Save settings to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('farisly-settings', JSON.stringify(settings));
    }

    // Save extension settings to user profile
    try {
      const profileResponse = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extensionSettings: {
            enableOnAllSites: settings.enableOnAllSites,
            allowedSites: settings.allowedSites
          }
        })
      });

      if (!profileResponse.ok) {
        console.error('Failed to save extension settings to profile');
      } else {
        console.log('✅ Extension settings saved to user profile');

        // Trigger immediate config sync in extension
        try {
          if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime) {
            // Try to sync - if service worker is inactive, this will wake it up
            let syncSuccessful = false;
            const attemptSync = (retryCount = 0) => {
              (window as any).chrome.runtime.sendMessage({ type: 'SYNC_EXTENSION_CONFIG' }, (response: any) => {
                if ((window as any).chrome.runtime.lastError) {
                  const error = (window as any).chrome.runtime.lastError.message;
                  console.log('Extension sync attempt failed:', error);

                  // Retry up to 2 times with increasing delays
                  if (retryCount < 2) {
                    const delay = retryCount === 0 ? 500 : 1000;
                    setTimeout(() => attemptSync(retryCount + 1), delay);
                  } else {
                    // All retries failed
                    toast.info('Extension will sync automatically within 30 seconds');
                  }
                } else if (response && response.success) {
                  console.log('✅ Extension config synced immediately');
                  if (!syncSuccessful) {
                    syncSuccessful = true;
                    toast.success('Extension settings synced immediately!');
                  }
                } else {
                  console.warn('Extension sync returned error:', response?.message);
                  toast.info('Extension will sync automatically within 30 seconds');
                }
              });
            };
            attemptSync();
          } else {
            // Extension not installed
            toast.info('Settings saved. Install the browser extension to use them.');
          }
        } catch (err) {
          console.log('Chrome extension API not available');
          toast.info('Settings saved. Install the browser extension to use them.');
        }
      }
    } catch (error) {
      console.error('Error saving extension settings to profile:', error);
    }

    // Save to extension storage
    try {
      // Save API key to extension
      if (settings.openaiKey) {
        await fetch('http://localhost:3000/api/extension/set-api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: settings.openaiKey })
        });
      }
      // Save settings to extension
      await fetch('http://localhost:3000/api/extension/set-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          savedReplies: settings.quickReplies.map(qr => ({
            title: qr.title,
            content: qr.text
          })),
          aiInstructions: settings.instructions
            .filter(inst => inst.enabled)
            .map(inst => inst.text)
            .join('\n')
        })
      });
      console.log('Settings saved to extension:', settings);
    } catch (error) {
      console.error('Error saving to extension:', error);
    }

    // Update state to reflect saved settings
    setInitialSettings(JSON.parse(JSON.stringify(settings)));
    setHasUnsavedChanges(false);
  };

  // Keyword management functions
  const addKeyword = () => {
    const keyword = newKeyword.trim().toLowerCase();
    if (keyword && !settings.allowedSites.includes(keyword)) {
      handleSettingChange('allowedSites', [...settings.allowedSites, keyword]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    handleSettingChange('allowedSites', settings.allowedSites.filter((_, i) => i !== index));
  };

  const updateKeyword = (index: number, newValue: string) => {
    const keyword = newValue.trim().toLowerCase();
    if (keyword && !settings.allowedSites.includes(keyword)) {
      handleSettingChange('allowedSites', settings.allowedSites.map((k, i) => i === index ? keyword : k));
    }
    setEditingKeyword(null);
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addKeyword();
    }
  };

  const addInstruction = () => {
    if (newInstruction.trim()) {
      const instruction = {
        id: Date.now().toString(),
        text: newInstruction.trim(),
        enabled: true,
        createdAt: new Date().toISOString()
      };
      handleSettingChange('instructions', [...settings.instructions, instruction]);
      setNewInstruction('');
      setShowAddInstruction(false);
    }
  };

  const addQuickReply = () => {
    if (newQuickReply.title.trim() && newQuickReply.text.trim()) {
      const quickReply = {
        key: newQuickReply.title.toLowerCase().replace(/\s+/g, '_').slice(0, 40),
        title: newQuickReply.title.trim(),
        text: newQuickReply.text.trim()
      };
      handleSettingChange('quickReplies', [...settings.quickReplies, quickReply]);
      setNewQuickReply({ title: '', text: '' });
      setShowAddQuickReply(false);
    }
  };

  const filteredInstructions = settings.instructions.filter(inst =>
    inst.text.toLowerCase().includes(searchInstructions.toLowerCase())
  );

  const filteredQuickReplies = settings.quickReplies.filter(qr =>
    qr.title.toLowerCase().includes(searchQuickReplies.toLowerCase()) ||
    qr.text.toLowerCase().includes(searchQuickReplies.toLowerCase())
  );

  // Show loading state until settings are loaded
  if (!isLoaded) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-white">{t('panel.loading')}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('panel.headerTitle')}</h1>
          <p className="text-gray-400">{t('panel.headerSubtitle')}</p>
        </div>

        {/* Sticky Save Button */}
        <div className="fixed top-4 right-8 z-50">
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              hasUnsavedChanges
                ? 'bg-white text-black hover:bg-gray-100 shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed shadow-md'
            }`}
          >
            <Save className="w-4 h-4" />
            {hasUnsavedChanges ? t('panel.saveSettings') : t('panel.noChanges')}
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Extension Activation */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">{t('panel.extensionActivation.title')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <div className="text-white text-sm font-medium mb-1">{t('panel.extensionActivation.enableOnAllSites')}</div>
                  <div className="text-gray-400 text-xs">{t('panel.extensionActivation.enableOnAllSitesDescription')}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableOnAllSites}
                    onChange={(e) => handleSettingChange('enableOnAllSites', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
                </label>
              </div>
              
              {!settings.enableOnAllSites && (
                <div className="py-3">
                  <label className="block text-white text-sm font-medium mb-2">
                    {t('panel.extensionActivation.allowedSites')}
                  </label>
                  <div className="min-h-[80px] p-3 bg-[#0a0a0a] border border-gray-800 rounded-lg">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {settings.allowedSites.map((keyword, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 border border-gray-600 rounded-full text-white text-sm"
                        >
                          {editingKeyword === index ? (
                            <input
                              type="text"
                              defaultValue={keyword}
                              onBlur={(e) => updateKeyword(index, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateKeyword(index, e.target.value);
                                } else if (e.key === 'Escape') {
                                  setEditingKeyword(null);
                                }
                              }}
                              className="bg-transparent text-white text-sm border-none outline-none min-w-[60px]"
                              autoFocus
                            />
                          ) : (
                            <>
                              <span
                                className="cursor-pointer hover:text-gray-300"
                                onClick={() => setEditingKeyword(index)}
                              >
                                {keyword}
                              </span>
                              <button
                                onClick={() => removeKeyword(index)}
                                className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
                              >
                                ×
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      onBlur={() => {
                        if (newKeyword.trim()) {
                          addKeyword();
                        }
                      }}
                      placeholder={t('panel.extensionActivation.keywordPlaceholder')}
                      className="w-full px-3 py-2 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t('panel.extensionActivation.keywordDescription')}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Agent Settings */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">{t('panel.aiAgent.title')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <div className="text-white text-sm font-medium mb-1">{t('panel.aiAgent.useNameSignature')}</div>
                  <div className="text-gray-400 text-xs">{t('panel.aiAgent.useNameSignatureDescription')}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.useNameSignature}
                    onChange={(e) => handleSettingChange('useNameSignature', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
                </label>
              </div>

              {settings.useNameSignature && (
                <div className="py-3 border-b border-gray-800">
                  <label className="block text-white text-sm font-medium mb-2">{t('panel.aiAgent.agentName')}</label>
                  <input
                    type="text"
                    value={settings.agentName}
                    onChange={(e) => handleSettingChange('agentName', e.target.value)}
                    placeholder={t('panel.aiAgent.agentNamePlaceholder')}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                  />
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <div className="text-white text-sm font-medium mb-1">{t('panel.aiAgent.useLineSpacing')}</div>
                  <div className="text-gray-400 text-xs">{t('panel.aiAgent.useLineSpacingDescription')}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.useLineSpacing}
                    onChange={(e) => handleSettingChange('useLineSpacing', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <div className="text-white text-sm font-medium mb-1">{t('panel.aiAgent.useToneSettings')}</div>
                  <div className="text-gray-400 text-xs">{t('panel.aiAgent.useToneSettingsDescription')}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.useToneSettings}
                    onChange={(e) => handleSettingChange('useToneSettings', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
                </label>
              </div>

              {settings.useToneSettings && (
                <div className="py-3 border-b border-gray-800">
                  <label className="block text-white text-sm font-medium mb-2">{t('panel.aiAgent.agentTone')}</label>
                  <select
                    value={settings.agentTone}
                    onChange={(e) => handleSettingChange('agentTone', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-gray-700"
                  >
                    <option value="friendly">{t('panel.aiAgent.toneOptions.friendly')}</option>
                    <option value="professional">{t('panel.aiAgent.toneOptions.professional')}</option>
                    <option value="casual">{t('panel.aiAgent.toneOptions.casual')}</option>
                    <option value="formal">{t('panel.aiAgent.toneOptions.formal')}</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <div className="text-white text-sm font-medium mb-1">{t('panel.aiAgent.useOpenAI')}</div>
                  <div className="text-gray-400 text-xs">{t('panel.aiAgent.useOpenAIDescription')}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.useOpenAI}
                    onChange={(e) => handleSettingChange('useOpenAI', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
                </label>
              </div>

              {settings.useOpenAI && (
                <div className="py-3">
                  <label className="block text-white text-sm font-medium mb-2">{t('panel.aiAgent.openaiKey')}</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={settings.openaiKey}
                      onChange={(e) => handleSettingChange('openaiKey', e.target.value)}
                      placeholder={t('panel.aiAgent.openaiKeyPlaceholder')}
                      className="w-full px-3 py-2 pr-10 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-white">{t('panel.instructions.title')}</h3>
              </div>
              <button
                onClick={() => setShowAddInstruction(true)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('panel.instructions.addInstruction')}
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={searchInstructions}
                onChange={(e) => setSearchInstructions(e.target.value)}
                placeholder={t('panel.instructions.searchPlaceholder')}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
              />
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {filteredInstructions.map((instruction) => (
                <div key={instruction.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={instruction.enabled}
                    onChange={(e) => {
                      const updated = settings.instructions.map(inst =>
                        inst.id === instruction.id ? { ...inst, enabled: e.target.checked } : inst
                      );
                      handleSettingChange('instructions', updated);
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-white text-sm">{instruction.text}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {t('panel.instructions.created')}: {new Date(instruction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingInstruction(instruction)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      {t('panel.common.edit')}
                    </button>
                    <button
                      onClick={() => {
                        const updated = settings.instructions.filter(inst => inst.id !== instruction.id);
                        handleSettingChange('instructions', updated);
                      }}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAddInstruction && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <textarea
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  placeholder={t('panel.instructions.textareaPlaceholder')}
                  className="w-full h-20 px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addInstruction}
                    className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    {t('panel.common.add')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddInstruction(false);
                      setNewInstruction('');
                    }}
                    className="px-4 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
                  >
                    {t('panel.common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-white">{t('panel.quickReplies.title')}</h3>
              </div>
              <button
                onClick={() => setShowAddQuickReply(true)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('panel.quickReplies.addReply')}
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={searchQuickReplies}
                onChange={(e) => setSearchQuickReplies(e.target.value)}
                placeholder={t('panel.quickReplies.searchPlaceholder')}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
              />
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {filteredQuickReplies.map((quickReply) => (
                <div key={quickReply.key} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium mb-1">{quickReply.title}</div>
                      <div className="text-gray-400 text-sm">{quickReply.text}</div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditingQuickReply(quickReply)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        {t('panel.common.edit')}
                      </button>
                      <button
                        onClick={() => {
                          const updated = settings.quickReplies.filter(qr => qr.key !== quickReply.key);
                          handleSettingChange('quickReplies', updated);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showAddQuickReply && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <input
                  type="text"
                  value={newQuickReply.title}
                  onChange={(e) => setNewQuickReply(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('panel.quickReplies.titlePlaceholder')}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 mb-3"
                />
                <textarea
                  value={newQuickReply.text}
                  onChange={(e) => setNewQuickReply(prev => ({ ...prev, text: e.target.value }))}
                  placeholder={t('panel.quickReplies.contentPlaceholder')}
                  className="w-full h-20 px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addQuickReply}
                    className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    {t('panel.common.add')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddQuickReply(false);
                      setNewQuickReply({ title: '', text: '' });
                    }}
                    className="px-4 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
                  >
                    {t('panel.common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel Settings */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">{t('panel.panelSettings.title')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <div>
                  <div className="text-white text-sm font-medium mb-1">{t('panel.panelSettings.panelMinimized')}</div>
                  <div className="text-gray-400 text-xs">{t('panel.panelSettings.panelMinimizedDescription')}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.panelMinimized}
                    onChange={(e) => handleSettingChange('panelMinimized', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-300 peer-checked:border peer-checked:border-gray-400"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Import/Export */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">{t('panel.importExport.title')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-white text-sm font-medium">{t('panel.importExport.instructions')}</h4>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
                    <Upload className="w-4 h-4" />
                    {t('panel.importExport.import')}
                  </button>
                  <button className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
                    <Download className="w-4 h-4" />
                    {t('panel.importExport.export')}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-white text-sm font-medium">{t('panel.importExport.quickReplies')}</h4>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
                    <Upload className="w-4 h-4" />
                    {t('panel.importExport.import')}
                  </button>
                  <button className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
                    <Download className="w-4 h-4" />
                    {t('panel.importExport.export')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}