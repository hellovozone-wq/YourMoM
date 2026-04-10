import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  Play, 
  RotateCcw, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  Clock,
  Volume2,
  Upload,
  FileAudio,
  Download,
  Copy,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { processMeetingAudio } from '@/services/gemini';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function App() {
  const { 
    isRecording, 
    recordingTime, 
    formatTime, 
    startRecording, 
    stopRecording, 
    audioBlob: recordedBlob 
  } = useAudioRecorder();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeBlob = uploadedFile || recordedBlob;

  const handleProcess = async () => {
    if (!activeBlob) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const response = await processMeetingAudio(activeBlob);
      setResult(response);
    } catch (err) {
      console.error(err);
      setError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setUploadedFile(file);
        setResult(null);
        setError(null);
      } else {
        setError('Please select a valid audio file.');
      }
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-[#E6E6E6] p-4 md:p-8 font-sans text-[#151619]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#151619]">YourMoM</h1>
            <p className="text-sm text-[#8E9299] font-mono uppercase tracking-wider">AI Meeting Assistant v1.1</p>
          </div>
          <Badge variant="outline" className="border-[#151619] text-[#151619] font-mono">
            {isRecording ? 'STATUS: RECORDING' : isProcessing ? 'STATUS: PROCESSING' : 'STATUS: READY'}
          </Badge>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recorder Widget */}
          <div className="lg:col-span-5">
            <Card className="bg-[#151619] border-none shadow-2xl overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-sm font-mono tracking-widest uppercase">
                  <Volume2 className="w-4 h-4 text-[#FF4444]" />
                  Audio Input
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex flex-col items-center justify-center space-y-8">
                {/* Visualizer Placeholder / Timer */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className={cn(
                    "absolute inset-0 border-2 border-dashed border-[#8E9299] rounded-full transition-all duration-500",
                    isRecording && "animate-spin-slow border-[#FF4444] scale-110",
                    uploadedFile && "border-[#00FF00] scale-105"
                  )} />
                  
                  <div className="text-center z-10">
                    {uploadedFile ? (
                      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <FileAudio className="w-12 h-12 text-[#00FF00] mb-2" />
                        <div className="text-[10px] font-mono text-white uppercase tracking-wider max-w-[120px] truncate">
                          {uploadedFile.name}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl font-mono text-white tracking-tighter mb-1">
                          {formatTime(recordingTime)}
                        </div>
                        <div className="text-[10px] font-mono text-[#8E9299] uppercase tracking-[0.2em]">
                          Elapsed Time
                        </div>
                      </>
                    )}
                  </div>

                  {/* Pulsing glow when recording */}
                  <AnimatePresence>
                    {isRecording && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.2, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute inset-0 bg-[#FF4444] rounded-full blur-2xl"
                      />
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <div className="flex gap-3">
                    {!isRecording ? (
                      <Button 
                        onClick={startRecording}
                        disabled={isProcessing || !!uploadedFile}
                        className="flex-1 bg-[#FF4444] hover:bg-[#CC3333] text-white border-none h-14 rounded-xl text-lg font-bold transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Mic className="mr-2 w-5 h-5" />
                        Record
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopRecording}
                        className="flex-1 bg-white hover:bg-gray-200 text-[#151619] border-none h-14 rounded-xl text-lg font-bold transition-all active:scale-95"
                      >
                        <Square className="mr-2 w-5 h-5 fill-current" />
                        Stop
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isRecording || isProcessing}
                      className="w-14 h-14 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                      <Upload className="w-6 h-6" />
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="audio/*" 
                      className="hidden" 
                    />
                  </div>

                  {uploadedFile && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setUploadedFile(null)}
                      className="text-[#8E9299] hover:text-white text-[10px] font-mono uppercase"
                    >
                      <RotateCcw className="w-3 h-3 mr-2" />
                      Remove File
                    </Button>
                  )}
                </div>

                {activeBlob && !isRecording && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full space-y-4"
                  >
                    <Separator className="bg-white/10" />
                    <div className="flex items-center justify-between text-[#8E9299] font-mono text-[10px] uppercase tracking-wider">
                      <span>{uploadedFile ? 'File Selected' : 'Recording Captured'}</span>
                      <span>{(activeBlob.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <Button 
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className="w-full bg-[#00FF00] hover:bg-[#00CC00] text-[#151619] h-12 rounded-xl font-bold"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 w-4 h-4" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="lg:col-span-7">
            <Card className="h-full border-none shadow-xl rounded-2xl bg-white flex flex-col min-h-[500px]">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">Meeting Insights</CardTitle>
                    <CardDescription>AI-generated transcription with speaker ID</CardDescription>
                  </div>
                  {result && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCopy} 
                        className={cn(
                          "transition-all duration-200",
                          copied ? "text-[#00FF00]" : "text-[#151619] hover:bg-gray-100"
                        )}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDownload} className="text-[#151619] hover:bg-gray-100">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="ghost" size="sm" onClick={reset} className="text-[#8E9299] hover:text-[#151619]">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {!result && !isProcessing ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">No Insights Yet</h3>
                      <p className="text-sm text-gray-500 max-w-[280px]">
                        Record a meeting or upload an audio file to see the AI analysis here.
                      </p>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 space-y-6">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-[#151619] animate-spin" />
                      <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#00FF00]" />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="font-semibold text-gray-900">Processing Audio</h3>
                      <p className="text-sm text-gray-500 animate-pulse">
                        Gemini is transcribing and summarizing your meeting...
                      </p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] p-6">
                    <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-gray-600 prose-li:text-gray-600">
                      <ReactMarkdown>{result || ''}</ReactMarkdown>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .markdown-body {
          font-family: inherit;
        }
        .markdown-body h1 { font-size: 1.5rem; margin-top: 1.5rem; margin-bottom: 1rem; }
        .markdown-body h2 { font-size: 1.25rem; margin-top: 1.25rem; margin-bottom: 0.75rem; }
        .markdown-body p { margin-bottom: 1rem; line-height: 1.6; }
        .markdown-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .markdown-body li { margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}
