"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploadProps {
  onFileSelected: (filePath: string) => void
}

export function FileUpload({ onFileSelected }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isUploaded, setIsUploaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's a Python file
    if (!file.name.endsWith(".py")) {
      setError("Please select a Python (.py) file")
      setFileName(null)
      setIsUploaded(false)
      return
    }

    setFileName(file.name)
    setError(null)

    // In a real app, you would upload the file to the server here
    // For this demo, we'll simulate a successful upload
    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // In a real app, this would be the path where the file was saved on the server
      const serverFilePath = `scripts/${file.name}`

      setIsUploaded(true)
      onFileSelected(serverFilePath)

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      })
    } catch (err) {
      setError("Failed to upload file")
      setIsUploaded(false)

      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      })
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input ref={fileInputRef} type="file" accept=".py" onChange={handleFileChange} className="hidden" />
        <Button type="button" variant="outline" onClick={triggerFileInput} className="gap-2">
          <Upload className="h-4 w-4" />
          Select Python File
        </Button>
        {fileName && (
          <div className="flex items-center gap-2 text-sm">
            {isUploaded ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : error ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : null}
            <span className={error ? "text-red-500" : ""}>{fileName}</span>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">Note: In this demo, files aren't actually uploaded to the server.</p>
    </div>
  )
}
