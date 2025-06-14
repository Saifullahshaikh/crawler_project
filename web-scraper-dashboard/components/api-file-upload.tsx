"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Check, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { uploadPythonFile, getAvailablePythonFiles } from "@/app/actions/python-api-scrape"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect } from "react"

interface ApiFileUploadProps {
  onFileSelected: (filePath: string) => void
}

export function ApiFileUpload({ onFileSelected }: ApiFileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableFiles, setAvailableFiles] = useState<string[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string>("uploads/default_scraper.py")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load available Python files on component mount
  useEffect(() => {
    loadAvailableFiles()
  }, [])

  const loadAvailableFiles = async () => {
    setIsLoadingFiles(true)
    try {
      const files = await getAvailablePythonFiles()
      setAvailableFiles(files)
      if (files.length > 0 && !selectedFile) {
        const defaultFile = `uploads/${files[0]}`
        setSelectedFile(defaultFile)
        onFileSelected(defaultFile)
      }
    } catch (err) {
      toast({
        title: "Failed to load files",
        description: "Could not load available Python files",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's a Python file
    if (!file.name.endsWith(".py")) {
      setError("Please select a Python (.py) file")
      setFileName(null)
      return
    }

    setFileName(file.name)
    setError(null)
    setIsUploading(true)

    try {
      const { filePath } = await uploadPythonFile(file)
      setSelectedFile(filePath)
      onFileSelected(filePath)

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      })

      // Refresh the file list
      await loadAvailableFiles()
    } catch (err) {
      setError("Failed to upload file")

      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectFile = (value: string) => {
    const filePath = `uploads/${value}`
    setSelectedFile(filePath)
    onFileSelected(filePath)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input ref={fileInputRef} type="file" accept=".py" onChange={handleFileChange} className="hidden" />
        <Button type="button" variant="outline" onClick={triggerFileInput} disabled={isUploading} className="gap-2">
          {isUploading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Python File
            </>
          )}
        </Button>
        {fileName && (
          <div className="flex items-center gap-2 text-sm">
            {!isUploading && !error && <Check className="h-4 w-4 text-green-500" />}
            {error && <AlertCircle className="h-4 w-4 text-red-500" />}
            <span className={error ? "text-red-500" : ""}>{fileName}</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1">
          <Select value={selectedFile.replace("uploads/", "")} onValueChange={handleSelectFile}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a Python file" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingFiles ? (
                <SelectItem value="loading" disabled>
                  Loading files...
                </SelectItem>
              ) : availableFiles.length === 0 ? (
                <SelectItem value="none" disabled>
                  No Python files available
                </SelectItem>
              ) : (
                availableFiles.map((file) => (
                  <SelectItem key={file} value={file}>
                    {file}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={loadAvailableFiles} disabled={isLoadingFiles}>
          <RefreshCw className={`h-4 w-4 ${isLoadingFiles ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  )
}
