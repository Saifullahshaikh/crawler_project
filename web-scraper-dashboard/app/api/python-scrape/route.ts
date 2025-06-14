import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execPromise = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { url, pythonFile } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    if (!pythonFile || typeof pythonFile !== "string") {
      return NextResponse.json({ error: "Python file path not provided" }, { status: 400 })
    }

    // Get the absolute path to the Python file
    // Note: In production, you should validate this path to prevent security issues
    const pythonFilePath = path.resolve(process.cwd(), pythonFile)

    // Execute the wrapper script with the Python file and URL as arguments
    const { stdout, stderr } = await execPromise(`python scripts/wrapper.py "${pythonFilePath}" "${url}"`)

    if (stderr) {
      console.error("Python script error:", stderr)
      return NextResponse.json({ error: stderr }, { status: 500 })
    }

    // Parse the JSON output from the Python script
    const result = JSON.parse(stdout)

    // Check if there was an error in the Python script
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error executing Python script:", error)
    return NextResponse.json(
      { error: `Failed to scrape: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
