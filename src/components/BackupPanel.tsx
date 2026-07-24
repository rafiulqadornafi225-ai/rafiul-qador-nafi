import React, { useState } from 'react';
import { Database, UploadCloud, DownloadCloud, Clipboard, Check, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Jersey } from '../types';

interface BackupPanelProps {
  isAdmin: boolean;
  jerseysList: Jersey[];
  bKashNumber: string;
  nagadNumber: string;
  whatsappNumber: string;
  bKashQR: string | null;
  nagadQR: string | null;
  webhookUrl: string | null;
  isSyncing: boolean;
  onRestoreState: (state: any) => Promise<boolean>;
  onManualSync: () => Promise<void>;
}

export default function BackupPanel({
  isAdmin,
  jerseysList,
  bKashNumber,
  nagadNumber,
  whatsappNumber,
  bKashQR,
  nagadQR,
  webhookUrl,
  isSyncing,
  onRestoreState,
  onManualSync,
}: BackupPanelProps) {
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [parsedImportState, setParsedImportState] = useState<any | null>(null);

  // Generate backup code
  const handleExportCode = () => {
    try {
      const backupObject = {
        version: 'nafi_jersey_v1',
        timestamp: Date.now(),
        bKashNumber,
        nagadNumber,
        whatsappNumber,
        bKashQR,
        nagadQR,
        webhookUrl,
        jerseys: jerseysList,
      };
      
      const backupString = JSON.stringify(backupObject);
      // Base64 encode for a neat, compact single-line string
      const base64Code = btoa(unescape(encodeURIComponent(backupString)));
      
      navigator.clipboard.writeText(base64Code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to export code', err);
    }
  };

  const handleValidateImportCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreMessage(null);
    const code = importCode.trim();
    if (!code) {
      setRestoreMessage({ success: false, text: 'Please enter a valid backup code.' });
      return;
    }

    try {
      let decodedStr = '';
      if (code.startsWith('{')) {
        // Clear text JSON
        decodedStr = code;
      } else {
        // Base64 string
        decodedStr = decodeURIComponent(escape(atob(code)));
      }

      const parsed = JSON.parse(decodedStr);
      if (!parsed.jerseys || !Array.isArray(parsed.jerseys)) {
        setRestoreMessage({ success: false, text: 'Invalid backup structure! Missing catalog/jerseys list.' });
        return;
      }

      setParsedImportState(parsed);
      setShowConfirmRestore(true);
    } catch (err) {
      setRestoreMessage({ success: false, text: 'Could not decode backup string! Ensure you copied the exact code.' });
    }
  };

  const handleConfirmRestore = async () => {
    if (!parsedImportState) return;
    setIsRestoring(true);
    setRestoreMessage(null);
    try {
      const success = await onRestoreState(parsedImportState);
      if (success) {
        setRestoreMessage({
          success: true,
          text: `🎉 Store backup restored successfully! Restored ${parsedImportState.jerseys.length} jerseys and updated active payment settings.`
        });
        setImportCode('');
        setShowConfirmRestore(false);
        setParsedImportState(null);
      } else {
        setRestoreMessage({ success: false, text: 'The server rejected the backup configuration. Please authorize and try again.' });
      }
    } catch (err: any) {
      setRestoreMessage({ success: false, text: `Restoration failed: ${err.message || 'unknown error'}` });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl font-sans mt-12">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 text-transparent bg-clip-text text-[10px] uppercase font-mono tracking-widest font-black">
              🛡️ Store State Safeguard Console
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"></span>
          </div>
          <h3 className="text-xl font-display font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Database className="w-5.5 h-5.5 text-emerald-400" />
            Cloud Sync & Database Backup
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Because our high-performance Cloud Run servers scale to zero to save local resources, local server storage may occasionally refresh. Use this console to sync state, download backups, or restore custom catalogs in a single click!
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-[11px] font-medium">
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span className="text-zinc-300 font-mono">
              {isSyncing ? 'Synchronizing with cloud...' : 'Connected & Self-Heal Guard Active'}
            </span>
          </div>

          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing}
            className="p-2 bg-zinc-900 border border-white/5 hover:border-white/15 rounded-lg active:scale-95 transition-all text-zinc-300 hover:text-white"
            title="Force immediate cloud sync"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Backups block */}
        <div className="bg-[#111113] border border-white/5 p-5 rounded-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Export Store Backup Code</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Generate a single secure text code combining your entire customized catalog of jerseys ({jerseysList.length} items), active bKash, Nagad, WhatsApp numbers, active QR codes, and configurations. You can save this code in document notes or share it via WhatsApp!
            </p>
          </div>

          <div className="bg-black/35 p-3.5 rounded-lg border border-white/5 flex items-center justify-between gap-4 mt-3">
            <div className="font-mono text-[10px] text-zinc-500 truncate max-w-[65%]">
              {copied ? 'Code Copied Successfully!' : 'Ready: nafi_jersey_v1-backup-[compressed]'}
            </div>
            
            <button
              type="button"
              onClick={handleExportCode}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all shadow-md active:scale-95 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Backup Copied!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" />
                  <span>Copy Backup Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import / Restoring blocks */}
        <div className="bg-[#111113] border border-white/5 p-5 rounded-xl space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DownloadCloud className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Restore Catalog Config</h4>
            </div>
            <p className="text-xs text-zinc-400">
              Paste a previously copied backup code below to instantly update the server configuration and sync all customized items.
            </p>
          </div>

          <form onSubmit={handleValidateImportCode} className="space-y-3">
            <div className="flex gap-2.5">
              <input
                type="text"
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste the backup code string here..."
                disabled={showConfirmRestore}
                className="w-full bg-black border border-white/10 hover:border-white/20 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-indigo-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={showConfirmRestore || !importCode.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase px-5 py-2 rounded-lg transition-all active:scale-95 duration-150 shrink-0"
              >
                Validate
              </button>
            </div>
          </form>

          {/* Confirm restore sub-card */}
          <AnimatePresence>
            {showConfirmRestore && parsedImportState && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-white block mb-0.5">Confirm Full Store Restore</span>
                    <p className="text-zinc-300">
                      This restore will reconstruct:
                    </p>
                    <ul className="list-disc pl-4 mt-1 text-[11px] text-zinc-400 space-y-0.5 font-mono">
                      <li>Jerseys count: <strong className="text-white">{parsedImportState.jerseys?.length || 0} items</strong></li>
                      <li>bKash Payment: <strong className="text-white">{parsedImportState.bKashNumber || 'N/A'}</strong></li>
                      <li>Nagad Payment: <strong className="text-white">{parsedImportState.nagadNumber || 'N/A'}</strong></li>
                      <li>WhatsApp: <strong className="text-white">{parsedImportState.whatsappNumber || 'N/A'}</strong></li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    disabled={isRestoring}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded active:scale-95 transition-all"
                  >
                    {isRestoring ? 'Restoring...' : 'Yes, Restore State'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmRestore(false);
                      setParsedImportState(null);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] uppercase font-bold px-3 py-1.5 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages info log */}
          {restoreMessage && (
            <div className={`p-3.5 rounded-lg border flex gap-3 text-xs ${restoreMessage.success ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-400' : 'bg-red-950/20 border-red-500/25 text-red-400'}`}>
              {restoreMessage.success ? (
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-400" />
              )}
              <div className="text-[11px] font-medium leading-relaxed">
                {restoreMessage.text}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
