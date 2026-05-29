import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, XCircle, RefreshCw, Zap, Server, ShieldCheck, Terminal, HelpCircle, ExternalLink, Globe, Key, Settings, AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AutomationHubProps {
  webhookUrl: string | null;
  webhookLogs: any[];
  onUpdateWebhookUrl: (url: string | null) => void;
  onClearWebhookLogs: () => void;
  onTestDispatch: () => Promise<{ success: boolean; statusText: string; error?: string }>;
}

export default function AutomationHub({
  webhookUrl,
  webhookLogs,
  onUpdateWebhookUrl,
  onClearWebhookLogs,
  onTestDispatch
}: AutomationHubProps) {
  const [inputUrl, setInputUrl] = useState(webhookUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setInputUrl(webhookUrl || '');
  }, [webhookUrl]);

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateWebhookUrl(inputUrl.trim() === '' ? null : inputUrl.trim());
      setTestResult({ success: true, message: "Webhook URL configuration updated & saved successfully!" });
    } catch {
      setTestResult({ success: false, message: "Failed to persist configuration on server storage." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerTest = async () => {
    if (!webhookUrl) {
      setTestResult({ success: false, message: "Please configure and save a Webhook URL first before testing!" });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestDispatch();
      if (res.success) {
        setTestResult({ success: true, message: `🎉 Automation delivery success: ${res.statusText}! Webhook responded affirmatively.` });
      } else {
        setTestResult({ success: false, message: `❌ Webhook endpoint responded with an error: ${res.statusText}` });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `⚠️ Connection failure: ${err.message || 'Can not reach destination endpoint'}` });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl font-sans mt-12">
      {/* Background visual cue grids */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-transparent bg-clip-text text-[10px] uppercase font-mono tracking-widest font-black">
              🔒 Store Merchant Integrations
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <h3 className="text-xl font-display font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Zap className="w-5.5 h-5.5 text-indigo-400" />
            AI & Messenger Automation Connect
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Configure outgoing webhooks to trigger instant automated notifications to your <strong className="text-white">Facebook Page</strong>, <strong className="text-white">Messenger</strong>, <strong className="text-white">Telegram</strong>, or <strong className="text-white">Discord Chat Channel</strong> immediately when a customer submits an order!
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 hover:border-emerald-500/30 text-zinc-300 hover:text-emerald-400 text-xs px-4 py-2 rounded-lg transition-all font-bold uppercase tracking-wider"
        >
          <HelpCircle className="w-4 h-4" />
          {showGuide ? "Hide Setup Instructions" : "How to Connect Facebook?"}
        </button>
      </div>

      {/* Guide Block Section Component */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-zinc-950/60 border border-indigo-500/20 p-5 rounded-xl space-y-4 text-xs leading-relaxed text-zinc-400 mb-6 font-sans">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-emerald-400" />
                Step-by-Step Guide: Receive Alerts Automatically on Facebook / Messenger
              </h4>
              <p>
                Since direct Facebook API connections require authorized business accounts, the standard, most reliable way to link this website is using custom bridge automation tools like <strong className="text-white">Make.com (Integromat)</strong> or <strong className="text-white">Zapier</strong>. It takes less than 3 minutes to test and configure:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-[#111] p-3.5 border border-white/5 rounded-lg">
                  <span className="font-mono text-[10px] text-indigo-400 font-extrabold uppercase">Step 1: Create Bridge Webhook</span>
                  <p className="mt-1 text-[11px]">
                    Go to <a href="https://www.make.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">Make.com <ExternalLink className="w-2.5 h-2.5" /></a> (completely free), create a scenario, and select <strong className="text-zinc-250">"Custom Webhook"</strong> as the trigger. Copy the generated Webhook URL address.
                  </p>
                </div>
                <div className="bg-[#111] p-3.5 border border-white/5 rounded-lg">
                  <span className="font-mono text-[10px] text-emerald-400 font-extrabold uppercase">Step 2: Paste Below & Test</span>
                  <p className="mt-1 text-[11px]">
                    Paste that URL into the setting form below, save it, and click <strong className="text-zinc-250">"Trigger Test Dispatch"</strong>. This website will instantly send a structured dummy order payload to Make.com!
                  </p>
                </div>
                <div className="bg-[#111] p-3.5 border border-white/5 rounded-lg">
                  <span className="font-mono text-[10px] text-amber-400 font-extrabold uppercase">Step 3: Route to Facebook Page</span>
                  <p className="mt-1 text-[11px]">
                    Add a second module in Make.com connecting to <strong className="text-zinc-250">"Facebook Pages"</strong> or <strong className="text-zinc-250">"Messenger"</strong>. Route the incoming transaction fields (Name, Phone, TrxID) to dispatch straight to your personal inbox!
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between flex-wrap gap-2">
                <p className="text-[10.5px] italic text-zinc-500">
                  💡 <strong>Protip:</strong> You can also paste standard <strong>Discord Webhook URLs</strong> or <strong>Telegram bot endpoints API</strong> directly, and they will render formatted jerseys alerts automatically!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* URL Settings Panel */}
        <div className="lg:col-span-7 bg-[#111113] border border-white/5 p-5 rounded-xl space-y-5">
          <form onSubmit={handleSaveUrl} className="space-y-4">
            <div>
              <label htmlFor="webhook-url-input" className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-black mb-1.5">
                Target Automation Webhook URL Node
              </label>
              <div className="flex gap-2.5">
                <input
                  id="webhook-url-input"
                  type="url"
                  placeholder="https://hook.us1.make.com/xxxxxxxxx or Discord/Telegram webhook url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-black border border-white/10 hover:border-white/20 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-indigo-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-805 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-lg transition-all active:scale-95 duration-150 flex items-center justify-center shrink-0"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Config"
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Test triggering widgets */}
          <div className="bg-black/30 border border-indigo-500/10 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-[#00e194] bg-[#00e194]/10 border border-[#00e194]/20 px-2 py-0.5 rounded uppercase font-bold">
                Connection Check
              </span>
              <p className="text-xs text-zinc-300 font-bold block pt-1">
                Trigger a Simulated Mock Order Dispatch
              </p>
              <p className="text-[10px] text-zinc-500">
                Verifies if your webhook triggers and logs response payloads instantly on this dashboard. No real buyers needed!
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleTriggerTest}
              disabled={isTesting || !webhookUrl}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#141d26] border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              {isTesting ? "Dispatching..." : "Send Test Order"}
            </button>
          </div>

          {/* Test Status Indicators alerts */}
          {testResult && (
            <div className={`p-4 rounded-lg border flex gap-3 text-xs ${testResult.success ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-400' : 'bg-red-950/20 border-red-500/25 text-red-400'}`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" />
              )}
              <div>
                <span className="font-bold uppercase tracking-wider block mb-0.5">Integration Update</span>
                <p className="text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Exec Logs Dashboard panel */}
        <div className="lg:col-span-5 bg-[#111113] border border-white/5 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-xs font-mono font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Execution Delivery Logs
            </h4>
            
            {webhookLogs.length > 0 && (
              <button
                type="button"
                onClick={onClearWebhookLogs}
                className="text-zinc-500 hover:text-zinc-300 font-mono text-[9px] uppercase tracking-wider"
              >
                Clear History
              </button>
            )}
          </div>

          {webhookLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-3 bg-black/20 rounded-lg border border-dashed border-white/5">
              <div className="p-3 bg-zinc-900 border border-white/5 rounded-full text-zinc-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-semibold mb-0.5">No Deliveries Registered Yet</p>
                <p className="text-[10px] text-zinc-650 max-w-sm px-4">
                  Webhook delivery logs will manifest here in real-time when buyers check out or when you fire test alerts!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {webhookLogs.map((log) => {
                const isSuccess = log.success;
                const isExpanded = expandedLogId === log.id;
                
                return (
                  <div key={log.id} className="bg-black/50 border border-white/5 hover:border-white/10 rounded-lg overflow-hidden transition-all duration-150">
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2.5 text-[11px] hover:bg-white/5 transition-all text-zinc-300 focus:outline-none"
                    >
                      <div className="flex items-center gap-2 max-w-[70%]">
                        <span className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-[#00e194] animate-pulse' : 'bg-red-500'}`}></span>
                        <div className="truncate font-mono">
                          <span className="font-bold text-white uppercase">{log.payload.event === 'test_dispatch' ? 'Test' : 'Order'}</span>
                          <span className="text-zinc-550 ml-1">#{log.orderId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono text-[9px]">
                        <span className="text-zinc-500">{log.timestamp}</span>
                        <span className={`px-1.5 py-0.5 rounded font-extrabold ${isSuccess ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' : 'bg-red-950/30 border border-red-500/20 text-red-400'}`}>
                          {log.statusText || (isSuccess ? '200 OK' : 'ERR')}
                        </span>
                      </div>
                    </button>

                    {/* Expandable JSON Body section */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 bg-black/80 font-mono text-[9.5px] leading-relaxed text-zinc-400 space-y-2">
                        <div>
                          <span className="text-zinc-550 block mb-1">Target Endpoint Address:</span>
                          <span className="text-indigo-350 break-all bg-zinc-950 px-2 py-1 rounded border border-white/5 block">{log.webhookUrl}</span>
                        </div>
                        <div>
                          <span className="text-zinc-550 block mb-1">Forwarded Payload:</span>
                          <pre className="p-2.5 bg-zinc-950 rounded border border-white/5 overflow-x-auto text-zinc-300 max-h-[150px]">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
