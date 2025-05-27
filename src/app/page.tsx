"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const getTimestampedFilename = (baseName: string) => {
  // Only create timestamp when function is called (client-side)
  const timestamp = new Date().toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-')
    .slice(0, -1) // Remove the trailing 'Z'
  return `${baseName}_${timestamp}.ris`
}

// When downloading files, use this to prevent hydration errors:
const downloadFile = (content: string, baseFileName: string) => {
  // All DOM manipulation happens on client-side
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = getTimestampedFilename(baseFileName)
  // Append to body only when downloading
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Add this helper function at the top of your file
const getCommonBaseName = (files: FileWithCount[]): string => {
  if (files.length === 0) return 'output';
  
  const names = files.map(f => f.file.name.replace(/\.ris$/, ''));
  
  // Find the common prefix among all filenames
  let commonPrefix = names[0];
  for (let i = 1; i < names.length; i++) {
    while (names[i].indexOf(commonPrefix) !== 0) {
      commonPrefix = commonPrefix.slice(0, -1);
      if (commonPrefix === '') break;
    }
  }
  
  // Clean up the common prefix
  commonPrefix = commonPrefix
    .replace(/[-_]?[vV]\d+$/, '') // Remove version numbers like v1, V2, etc.
    .replace(/[-_]\d+$/, '')      // Remove trailing numbers
    .replace(/[-_]+$/, '');       // Remove trailing dashes or underscores
  
  return commonPrefix || names[0] || 'output';
}

// Add this interface for file with count
interface FileWithCount {
  file: File;
  count: number | null;
}

export default function Home() {
  const [dragActive, setDragActive] = useState(false)
  // Update the files state to include counts
  const [files, setFiles] = useState<FileWithCount[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedResult, setProcessedResult] = useState<{
    content: string;
    duplicateContent: string;
    count: number;
    duplicateCount: number;
  } | null>(null)

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Modify handleDrop to include counting
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files) {
      const validFiles = Array.from(e.dataTransfer.files).filter(file => {
        if (!file.name.endsWith('.ris')) {
          toast.error("Invalid file type", {
            description: `${file.name} is not a .ris file`
          })
          return false
        }
        return true
      })
      
      // Add files with null counts initially
      setFiles(prev => [...prev, ...validFiles.map(file => ({ file, count: null }))])
      
      // Count items for each file
      validFiles.forEach(async (file) => {
        const text = await file.text()
        const matches = text.match(/TY  -/g)
        const count = matches ? matches.length : 0
        
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, count } : f
        ))
      })
    }
  }, [])

  // Update handleFileChange similarly
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = Array.from(e.target.files).filter(file => {
        if (!file.name.endsWith('.ris')) {
          toast.error("Invalid file type", {
            description: `${file.name} is not a .ris file`
          })
          return false
        }
        return true
      })
      
      // Add files with null counts initially
      setFiles(prev => [...prev, ...validFiles.map(file => ({ file, count: null }))])
      
      // Count items for each file
      validFiles.forEach(async (file) => {
        const text = await file.text()
        const matches = text.match(/TY  -/g)
        const count = matches ? matches.length : 0
        
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, count } : f
        ))
      })
    }
  }

  const handleDelete = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    setFiles([])
  }

  const countRisItems = async (files: File[]) => {
    let totalItems = 0;
    
    for (const file of files) {
      const text = await file.text();
      // Count occurrences of TY - (which indicates start of a reference in RIS format)
      const matches = text.match(/TY  -/g);
      if (matches) {
        totalItems += matches.length;
      }
    }
    return totalItems;
  }

  // Update the processRisFiles function to track duplicates
  const processRisFiles = async (files: File[]) => {
    const allEntries = new Map<string, string>(); // lowercase title -> original content
    const duplicates = new Map<string, string[]>(); // lowercase title -> array of duplicate entries
    
    for (const file of files) {
      const text = await file.text();
      const entries = text.split(/\r?\n\r?\n/); // Split by blank lines
      
      for (const entry of entries) {
        if (!entry.trim()) continue;
        
        // Find the title line
        const titleMatch = entry.match(/^TI  - (.+)$/m);
        if (titleMatch) {
          const titleLower = titleMatch[1].toLowerCase();
          if (!allEntries.has(titleLower)) {
            allEntries.set(titleLower, entry + "\n\n");
          } else {
            if (!duplicates.has(titleLower)) {
              duplicates.set(titleLower, []);
            }
            duplicates.get(titleLower)?.push(entry + "\n\n");
          }
        }
      }
    }
    
    const uniqueContent = Array.from(allEntries.values()).join("");
    const duplicateContent = Array.from(duplicates.values())
      .flat()
      .join("");

    return {
      content: uniqueContent,
      duplicateContent: duplicateContent,
      count: allEntries.size,
      duplicateCount: Array.from(duplicates.values()).flat().length
    };
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9f9f9",
        gap: "2rem"
      }}
    >
      <div
        style={{
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "hsl(var(--foreground))",
            marginBottom: "0.5rem"
          }}
        >
          RIS Duplicate Remover
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          Upload your RIS files and remove duplicates based on titles
        </p>
      </div>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          width: "40vw",
          height: "40vh",
          border: dragActive ? "2px solid #0070f3" : "2px dashed #ccc",
          borderRadius: 12,
          background: "#fff",
          padding: "48px 64px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          transition: "border 0.2s",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto",
        }}
      >
        <p style={{ fontSize: 18, marginBottom: 16 }}>
          {files.length > 0
            ? `Files selected: ${files.length} files`
            : "Drag & drop files here"}
        </p>
        {files.length > 0 && (
          <>
            <ul style={{ marginBottom: 16, textAlign: "left", width: "100%" }}>
              {files.map((fileWithCount, index) => (
                <li key={index} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: 8,
                  alignItems: "center"
                }}>
                  <div>
                    <span>{fileWithCount.file.name}</span>
                    {fileWithCount.count !== null && (
                      <span style={{ 
                        marginLeft: 8, 
                        color: "hsl(var(--muted-foreground))",
                        fontSize: "0.875rem"
                      }}>
                        ({fileWithCount.count} items)
                      </span>
                    )}
                  </div>
                  {!isProcessing && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDelete(index)}
                      size="sm"
                      style={{ cursor: 'pointer' }}
                    >
                      Delete
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 8 }}>
              {!isProcessing && !processedResult && (
                <>
                  <Button asChild style={{ cursor: 'pointer' }}>
                    <label>
                      Add more files
                      <input
                        type="file"
                        multiple
                        accept=".ris"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                    </label>
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleClearAll}
                    style={{ cursor: 'pointer' }}
                  >
                    Clear All
                  </Button>
                </>
              )}
              {!processedResult && (
                <Button 
                  onClick={async () => {
                    try {
                      setIsProcessing(true)
                      const result = await processRisFiles(files.map(f => f.file))
                      setProcessedResult(result)
                      console.log(`Found ${result.count} unique papers and ${result.duplicateCount} duplicates`)
                      toast.success(`Found ${result.count} unique papers and ${result.duplicateCount} duplicates`)
                    } catch (error) {
                      console.error("Error processing files:", error)
                      toast.error("Error processing files")
                    } finally {
                      setIsProcessing(false)
                    }
                  }}
                  disabled={isProcessing}
                  style={{ cursor: isProcessing ? 'wait' : 'pointer' }}
                >
                  {isProcessing ? 'Processing RIS...' : 'Start Processing'}
                </Button>
              )}
              {processedResult && !isProcessing && (
                <>
                  <Button 
                    onClick={() => {
                      setProcessedResult(null)
                      setFiles([])
                    }}
                    variant="secondary"
                    style={{ cursor: 'pointer' }}
                  >
                    Start New Processing
                  </Button>
                  <Button
                    onClick={() => {
                      const baseFileName = getCommonBaseName(files);
                      downloadFile(processedResult.content, `${baseFileName}_unique`);
                      toast.success('Unique papers downloaded successfully')
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    Download Unique Items ({processedResult.count})
                  </Button>
                  {processedResult.duplicateCount > 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const baseFileName = getCommonBaseName(files);
                        downloadFile(processedResult.duplicateContent, `${baseFileName}_duplicates`);
                        toast.success('Duplicate papers downloaded successfully')
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      Download Duplicates ({processedResult.duplicateCount})
                    </Button>
                  )}
                </>
              )}
            </div>
          </>
        )}
        {files.length === 0 && (
          <Button asChild style={{ cursor: 'pointer' }}>
            <label>
              Or select files
              <input
                type="file"
                multiple
                accept=".ris"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </label>
          </Button>
        )}
      </div>
    </div>
  )
}
