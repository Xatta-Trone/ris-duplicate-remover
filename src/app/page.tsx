"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function Home() {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

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
      setFiles(prev => [...prev, ...validFiles])
    }
  }, [])

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
      setFiles(prev => [...prev, ...validFiles])
    }
  }

  const handleDelete = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    setFiles([])
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9f9f9",
      }}
    >
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
              {files.map((file, index) => (
                <li key={index} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>{file.name}</span>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDelete(index)}
                    size="sm"
                    style={{ cursor: 'pointer' }}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 8 }}>
              <Button asChild style={{ cursor: 'pointer' }}>
                <label>
                  Add more files
                  <input
                    type="file"
                    multiple
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
