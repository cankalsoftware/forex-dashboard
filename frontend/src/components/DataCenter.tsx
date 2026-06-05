import React, { useState } from 'react';
import { Upload, Key, HelpCircle, Check, AlertCircle, Link, Database } from 'lucide-react';

interface DataCenterProps {
  config: {
    data_source: string;
    api_keys: { [key: string]: string };
  };
  onConfigChange: (newConfig: any) => void;
  onFileUpload: (file: File, source: string) => Promise<boolean>;
}

export default function DataCenter({ config, onConfigChange, onFileUpload }: DataCenterProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'api'>('upload');
  const [uploadSource, setUploadSource] = useState<string>('Dukascopy');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  
  const [tempKeys, setTempKeys] = useState(config.api_keys);
  const [keySaved, setKeySaved] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus({ status: 'idle', message: '' });
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploadStatus({ status: 'loading', message: 'Uploading and parsing CSV...' });
    
    const success = await onFileUpload(selectedFile, uploadSource);
    if (success) {
      setUploadStatus({ status: 'success', message: `Successfully loaded ${selectedFile.name} as ${uploadSource} data source.` });
      setSelectedFile(null);
    } else {
      setUploadStatus({ status: 'error', message: 'Failed to parse CSV. Please check formatting matches the source selected.' });
    }
  };

  const handleSaveKeys = () => {
    onConfigChange({ api_keys: tempKeys });
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 backdrop-blur-xl glow-subtle">
      {/* Section Title */}
      <div className="flex items-center gap-3 mb-4 border-b border-slate-800/40 pb-3">
        <Database className="h-5 w-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-slate-100">Data Management Center</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60 mb-5">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'upload' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Custom CSV Data Center
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'api' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Live API Settings
        </button>
      </div>

      {/* Upload CSV Panel */}
      {activeTab === 'upload' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-slate-200">Import Historical CSV</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload exported historical bars/ticks. The app supports parsing native layouts from Dukascopy, HistData.com, and MT4/5 History centers.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['Dukascopy', 'HistData', 'MetaTrader'].map(src => (
              <button
                key={src}
                onClick={() => {
                  setUploadSource(src);
                  setSelectedFile(null);
                  setUploadStatus({ status: 'idle', message: '' });
                }}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  uploadSource === src 
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' 
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          {/* File input */}
          <div className="border border-dashed border-slate-850 rounded-xl bg-slate-950/40 p-6 flex flex-col items-center justify-center text-center">
            <Upload className="h-8 w-8 text-slate-600 mb-2" />
            <input
              type="file"
              accept=".csv,.zip"
              onChange={handleFileChange}
              id="csv-file-input"
              className="hidden"
            />
            <label 
              htmlFor="csv-file-input"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              {selectedFile ? 'Change selected file' : 'Choose a historical CSV file'}
            </label>
            <span className="text-[10px] text-slate-500 mt-1">Accepts UTF-8 encoded files</span>
            
            {selectedFile && (
              <div className="mt-3 flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
                <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          {/* Status Message */}
          {uploadStatus.status !== 'idle' && (
            <div className={`p-3 rounded-lg border text-xs flex gap-2 items-start ${
              uploadStatus.status === 'loading' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse' :
              uploadStatus.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {uploadStatus.status === 'success' ? <Check className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              <span>{uploadStatus.message}</span>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleUploadSubmit}
            disabled={!selectedFile || uploadStatus.status === 'loading'}
            className={`w-full py-2.5 text-xs font-semibold rounded-lg text-white shadow-lg transition-all ${
              selectedFile && uploadStatus.status !== 'loading'
                ? 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-indigo-500/10'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            Process & Load Database
          </button>
        </div>
      )}

      {/* Live API Keys Settings Panel */}
      {activeTab === 'api' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-slate-200">Connect Live Feed API</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Input API keys to enable live sub-second streaming ticks rather than standard rate-limited Yahoo Finance polling.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Twelve Data */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Twelve Data API Key</span>
                <a 
                  href="https://twelvedata.com/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  Get Free Key <Link className="h-2.5 w-2.5" />
                </a>
              </div>
              <input
                type="password"
                placeholder="Paste key here..."
                value={tempKeys.twelve_data || ''}
                onChange={(e) => setTempKeys({ ...tempKeys, twelve_data: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* OANDA */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">OANDA Token</span>
                <a 
                  href="https://www.oanda.com/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  OANDA Portal <Link className="h-2.5 w-2.5" />
                </a>
              </div>
              <input
                type="password"
                placeholder="Paste account token here..."
                value={tempKeys.oanda || ''}
                onChange={(e) => setTempKeys({ ...tempKeys, oanda: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Alpha Vantage */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Alpha Vantage API Key</span>
                <a 
                  href="https://www.alphavantage.co/support/#api-key" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  Get Key <Link className="h-2.5 w-2.5" />
                </a>
              </div>
              <input
                type="password"
                placeholder="Paste key here..."
                value={tempKeys.alpha_vantage || ''}
                onChange={(e) => setTempKeys({ ...tempKeys, alpha_vantage: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleSaveKeys}
            className="w-full py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1.5"
          >
            {keySaved ? (
              <>
                <Check className="h-4 w-4" /> API Keys Saved
              </>
            ) : (
              <>
                <Key className="h-4 w-4" /> Save API Credentials
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
