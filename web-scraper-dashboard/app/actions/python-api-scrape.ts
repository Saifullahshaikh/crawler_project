"use server"

import type { ScrapedData } from "./scrape"

// This assumes you have a Python API running at this URL
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:5000/api/scrape"

export async function scrapeWithPythonApi(
  urls: string[],
  pythonFile = "uploads/default_scraper.py",
): Promise<ScrapedData[]> {
  try {
    // Filter out empty URLs
    const validUrls = urls.filter((url) => url.trim() !== "")

    if (validUrls.length === 0) {
      throw new Error("No valid URLs provided")
    }

    const response = await fetch(PYTHON_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: validUrls,
        pythonFile: pythonFile,
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API responded with status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error calling Python API:", error)
    throw error
  }
}

// Function to upload a Python file to the API
export async function uploadPythonFile(file: File): Promise<{ filePath: string }> {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${process.env.PYTHON_API_URL || "http://localhost:5000"}/api/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API responded with status: ${response.status}`)
    }

    const result = await response.json()
    return { filePath: result.filePath }
  } catch (error) {
    console.error("Error uploading Python file:", error)
    throw error
  }
}

// Function to get available Python files
export async function getAvailablePythonFiles(): Promise<string[]> {
  try {
    const response = await fetch(`${process.env.PYTHON_API_URL || "http://localhost:5000"}/api/files`, {
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API responded with status: ${response.status}`)
    }

    const result = await response.json()
    return result.files || []
  } catch (error) {
    console.error("Error getting Python files:", error)
    return []
  }
}
