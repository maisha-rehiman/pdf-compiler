// Deploy trigger v2
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 1. Only allow incoming POST requests from n8n
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const htmlContent = await req.text()
    if (!htmlContent) {
      return new Response('Missing HTML content', { status: 400 })
    }

    // 2. Forward the HTML string to a public WASM-isolated headless Chromium compiler
    const response = await fetch("https://html-to-pdf-wasm.deno.dev/convert", {
      method: "POST",
      headers: { "Content-Type": "text/html" },
      body: htmlContent
    })

    if (!response.ok) {
      throw new Error(`Compiler backend returned status ${response.status}`)
    }

    const pdfBuffer = await response.arrayBuffer()

    // 3. Return the clean, compiled binary stream back out to n8n
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
      },
    })

  } catch (error) {
    return new Response(`PDF Generation Failed: ${error.message}`, { status: 500 })
  }
})
