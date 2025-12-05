'use client';

import { useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  FiFile, 
  FiChevronRight, 
  FiChevronDown,
  BsFolderFill, 
  BsFolder2Open,
  SiJavascript, 
  SiReact, 
  SiCss3, 
  SiJson 
} from '@/lib/icons';
import type { GenerationProgress, GeneratedFile } from '../types';

interface CodePreviewProps {
  generationProgress: GenerationProgress;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;
}

export function CodePreview({
  generationProgress,
  expandedFolders,
  toggleFolder,
  selectedFile,
  setSelectedFile
}: CodePreviewProps) {
  const codeDisplayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll code display to bottom when streaming
  useEffect(() => {
    if (codeDisplayRef.current && generationProgress.isStreaming) {
      codeDisplayRef.current.scrollTop = codeDisplayRef.current.scrollHeight;
    }
  }, [generationProgress.streamedCode, generationProgress.isStreaming]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext === 'jsx' || ext === 'js') {
      return <SiJavascript style={{ width: '16px', height: '16px' }} className="text-yellow-500" />;
    } else if (ext === 'tsx' || ext === 'ts') {
      return <SiReact style={{ width: '16px', height: '16px' }} className="text-blue-500" />;
    } else if (ext === 'css') {
      return <SiCss3 style={{ width: '16px', height: '16px' }} className="text-blue-500" />;
    } else if (ext === 'json') {
      return <SiJson style={{ width: '16px', height: '16px' }} className="text-gray-600" />;
    } else {
      return <FiFile style={{ width: '16px', height: '16px' }} className="text-gray-600" />;
    }
  };

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath);
  };

  return (
    <div className="absolute inset-0 flex overflow-hidden">
      {/* File Explorer - Hide during edits */}
      {!generationProgress.isEdit && (
        <FileExplorer
          files={generationProgress.files}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          selectedFile={selectedFile}
          handleFileClick={handleFileClick}
          getFileIcon={getFileIcon}
        />
      )}
      
      {/* Code Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Thinking Mode Display */}
        {generationProgress.isGenerating && (generationProgress.isThinking || generationProgress.thinkingText) && (
          <ThinkingDisplay progress={generationProgress} />
        )}
        
        {/* Live Code Display */}
        <div className="flex-1 rounded-lg p-6 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide" ref={codeDisplayRef}>
            {selectedFile ? (
              <SelectedFileView
                selectedFile={selectedFile}
                files={generationProgress.files}
                onClose={() => setSelectedFile(null)}
                getFileIcon={getFileIcon}
              />
            ) : generationProgress.files.length === 0 && !generationProgress.currentFile ? (
              generationProgress.isThinking ? (
                <LoadingState status={generationProgress.status} />
              ) : (
                <StreamingCodeDisplay streamedCode={generationProgress.streamedCode} />
              )
            ) : (
              <FileContentDisplay 
                progress={generationProgress}
                getFileIcon={getFileIcon}
              />
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        {generationProgress.components.length > 0 && (
          <div className="mx-6 mb-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
                style={{
                  width: `${(generationProgress.currentComponent / Math.max(generationProgress.components.length, 1)) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FileExplorerProps {
  files: GeneratedFile[];
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  selectedFile: string | null;
  handleFileClick: (path: string) => void;
  getFileIcon: (name: string) => ReactNode;
}

function FileExplorer({ 
  files, 
  expandedFolders, 
  toggleFolder, 
  selectedFile, 
  handleFileClick,
  getFileIcon 
}: FileExplorerProps) {
  // Group files by directory
  const fileTree: { [key: string]: Array<{ name: string; edited?: boolean }> } = {};
  
  files.forEach(file => {
    const parts = file.path.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
    const fileName = parts[parts.length - 1];
    
    if (!fileTree[dir]) fileTree[dir] = [];
    fileTree[dir].push({
      name: fileName,
      edited: file.edited || false
    });
  });

  return (
    <div className="w-[250px] border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
      <div className="p-4 bg-gray-100 text-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BsFolderFill style={{ width: '16px', height: '16px' }} />
          <span className="text-sm font-medium">Explorer</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div className="text-sm">
          {/* Root app folder */}
          <div 
            className="flex items-center gap-2 py-0.5 px-3 hover:bg-gray-100 rounded cursor-pointer text-gray-700"
            onClick={() => toggleFolder('app')}
          >
            {expandedFolders.has('app') ? (
              <FiChevronDown style={{ width: '16px', height: '16px' }} className="text-gray-600" />
            ) : (
              <FiChevronRight style={{ width: '16px', height: '16px' }} className="text-gray-600" />
            )}
            {expandedFolders.has('app') ? (
              <BsFolder2Open style={{ width: '16px', height: '16px' }} className="text-blue-500" />
            ) : (
              <BsFolderFill style={{ width: '16px', height: '16px' }} className="text-blue-500" />
            )}
            <span className="font-medium text-gray-800">app</span>
          </div>
          
          {expandedFolders.has('app') && (
            <div className="ml-6">
              {Object.entries(fileTree).map(([dir, dirFiles]) => (
                <div key={dir} className="mb-1">
                  {dir && (
                    <div 
                      className="flex items-center gap-2 py-0.5 px-3 hover:bg-gray-100 rounded cursor-pointer text-gray-700"
                      onClick={() => toggleFolder(dir)}
                    >
                      {expandedFolders.has(dir) ? (
                        <FiChevronDown style={{ width: '16px', height: '16px' }} className="text-gray-600" />
                      ) : (
                        <FiChevronRight style={{ width: '16px', height: '16px' }} className="text-gray-600" />
                      )}
                      {expandedFolders.has(dir) ? (
                        <BsFolder2Open style={{ width: '16px', height: '16px' }} className="text-yellow-600" />
                      ) : (
                        <BsFolderFill style={{ width: '16px', height: '16px' }} className="text-yellow-600" />
                      )}
                      <span className="text-gray-700">{dir.split('/').pop()}</span>
                    </div>
                  )}
                  {(!dir || expandedFolders.has(dir)) && (
                    <div className={dir ? 'ml-8' : ''}>
                      {dirFiles.sort((a, b) => a.name.localeCompare(b.name)).map(fileInfo => {
                        const fullPath = dir ? `${dir}/${fileInfo.name}` : fileInfo.name;
                        const isSelected = selectedFile === fullPath;
                        
                        return (
                          <div 
                            key={fullPath} 
                            className={`flex items-center gap-2 py-0.5 px-3 rounded cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-blue-500 text-white' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => handleFileClick(fullPath)}
                          >
                            {getFileIcon(fileInfo.name)}
                            <span className={`text-xs flex items-center gap-1 ${isSelected ? 'font-medium' : ''}`}>
                              {fileInfo.name}
                              {fileInfo.edited && (
                                <span className={`text-[10px] px-1 rounded ${
                                  isSelected ? 'bg-blue-400' : 'bg-orange-500 text-white'
                                }`}>✓</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThinkingDisplay({ progress }: { progress: GenerationProgress }) {
  return (
    <div className="px-6 pb-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-purple-600 font-medium flex items-center gap-2">
          {progress.isThinking ? (
            <>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
              AI is thinking...
            </>
          ) : (
            <>
              <span className="text-purple-600">✓</span>
              Thought for {progress.thinkingDuration || 0} seconds
            </>
          )}
        </div>
      </div>
      {progress.thinkingText && (
        <div className="bg-purple-950 border border-purple-700 rounded-lg p-4 max-h-48 overflow-y-auto scrollbar-hide">
          <pre className="text-xs font-mono text-purple-300 whitespace-pre-wrap">
            {progress.thinkingText}
          </pre>
        </div>
      )}
    </div>
  );
}

interface SelectedFileViewProps {
  selectedFile: string;
  files: GeneratedFile[];
  onClose: () => void;
  getFileIcon: (name: string) => ReactNode;
}

function SelectedFileView({ selectedFile, files, onClose, getFileIcon }: SelectedFileViewProps) {
  const file = files.find(f => f.path === selectedFile);
  const ext = selectedFile.split('.').pop()?.toLowerCase();
  const language = ext === 'css' ? 'css' : ext === 'json' ? 'json' : ext === 'html' ? 'html' : 'jsx';

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-black border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFileIcon(selectedFile)}
            <span className="font-mono text-sm">{selectedFile}</span>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-black/20 p-1 rounded transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              background: 'transparent',
            }}
            showLineNumbers={true}
          >
            {file?.content || '// File content will appear here'}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}

function LoadingState({ status }: { status: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="mb-8 relative">
          <div className="w-48 h-48 mx-auto">
            <div className="absolute inset-0 border-8 border-gray-800 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-green-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
        </div>
        <h3 className="text-xl font-medium text-white mb-2">AI is analyzing your request</h3>
        <p className="text-gray-400 text-sm">{status || 'Preparing to generate code...'}</p>
      </div>
    </div>
  );
}

function StreamingCodeDisplay({ streamedCode }: { streamedCode: string }) {
  return (
    <div className="bg-black border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-gray-100 text-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-16 h-16 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">Streaming code...</span>
        </div>
      </div>
      <div className="p-4 bg-gray-900 rounded">
        <SyntaxHighlighter
          language="jsx"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            background: 'transparent',
          }}
          showLineNumbers={true}
        >
          {streamedCode || 'Starting code generation...'}
        </SyntaxHighlighter>
        <span className="inline-block w-3 h-5 bg-orange-400 ml-1 animate-pulse" />
      </div>
    </div>
  );
}

function FileContentDisplay({ 
  progress, 
  getFileIcon 
}: { 
  progress: GenerationProgress; 
  getFileIcon: (name: string) => ReactNode;
}) {
  return (
    <div className="space-y-4">
      {/* Current file being generated */}
      {progress.currentFile && (
        <CurrentFileCard file={progress.currentFile} getFileIcon={getFileIcon} />
      )}
      
      {/* Completed files */}
      {progress.files.map((file, idx) => (
        <CompletedFileCard key={idx} file={file} />
      ))}
      
      {/* Remaining stream content */}
      {!progress.currentFile && progress.streamedCode.length > 0 && (
        <ProcessingDisplay streamedCode={progress.streamedCode} filesCount={progress.files.length} />
      )}
    </div>
  );
}

function CurrentFileCard({ file, getFileIcon }: { file: GeneratedFile; getFileIcon: (name: string) => ReactNode }) {
  const typeColors = {
    css: 'bg-blue-600',
    javascript: 'bg-yellow-600',
    json: 'bg-green-600',
    html: 'bg-gray-200 text-gray-700',
    text: 'bg-gray-200 text-gray-700'
  };

  return (
    <div className="bg-black border-2 border-gray-400 rounded-lg overflow-hidden shadow-sm">
      <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-16 h-16 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">{file.path}</span>
          <span className={`px-2 py-0.5 text-xs rounded ${typeColors[file.type]} text-white`}>
            {file.type === 'javascript' ? 'JSX' : file.type.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-700 rounded">
        <SyntaxHighlighter
          language={file.type === 'css' ? 'css' : file.type === 'json' ? 'json' : file.type === 'html' ? 'html' : 'jsx'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.75rem',
            background: 'transparent',
          }}
          showLineNumbers={true}
        >
          {file.content}
        </SyntaxHighlighter>
        <span className="inline-block w-3 h-4 bg-orange-400 ml-4 mb-4 animate-pulse" />
      </div>
    </div>
  );
}

function CompletedFileCard({ file }: { file: GeneratedFile }) {
  const typeColors = {
    css: 'bg-blue-600',
    javascript: 'bg-yellow-600',
    json: 'bg-green-600',
    html: 'bg-gray-200 text-gray-700',
    text: 'bg-gray-200 text-gray-700'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span className="font-mono text-sm">{file.path}</span>
        </div>
        <span className={`px-2 py-0.5 text-xs rounded ${typeColors[file.type]} text-white`}>
          {file.type === 'javascript' ? 'JSX' : file.type.toUpperCase()}
        </span>
      </div>
      <div className="bg-gray-900 border border-gray-700 max-h-48 overflow-y-auto scrollbar-hide">
        <SyntaxHighlighter
          language={file.type === 'css' ? 'css' : file.type === 'json' ? 'json' : file.type === 'html' ? 'html' : 'jsx'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.75rem',
            background: 'transparent',
          }}
          showLineNumbers={true}
          wrapLongLines={true}
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function ProcessingDisplay({ streamedCode, filesCount }: { streamedCode: string; filesCount: number }) {
  const lastFileEnd = filesCount > 0 ? streamedCode.lastIndexOf('</file>') + 7 : 0;
  let remainingContent = streamedCode.slice(lastFileEnd).trim();
  remainingContent = remainingContent.replace(/<explanation>[\s\S]*?<\/explanation>/g, '').trim();

  return (
    <div className="bg-black border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-16 h-16 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">Processing...</span>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-700 rounded">
        <SyntaxHighlighter
          language="jsx"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.75rem',
            background: 'transparent',
          }}
          showLineNumbers={false}
        >
          {remainingContent || 'Loading sandbox...'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}