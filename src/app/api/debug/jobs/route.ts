import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check which API keys are available
    const apiKeys = {
      ADZUNA_API_KEY: process.env.ADZUNA_API_KEY ? 'SET' : 'NOT SET',
      ADZUNA_APP_ID: process.env.ADZUNA_APP_ID ? 'SET' : 'NOT SET',
      JSEARCH_API_KEY: process.env.JSEARCH_API_KEY ? 'SET' : 'NOT SET',
      SERPAPI_KEY: process.env.SERPAPI_KEY ? 'SET' : 'NOT SET',
      SERPER_API_KEY: process.env.SERPER_API_KEY ? 'SET' : 'NOT SET',
    }

    // Test Adzuna API
    let adzunaTest = 'NOT TESTED'
    if (process.env.ADZUNA_API_KEY && process.env.ADZUNA_APP_ID) {
      try {
        const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_API_KEY}&what=developer&results_per_page=1`
        const response = await fetch(adzunaUrl)
        adzunaTest = response.ok ? 'SUCCESS' : `ERROR: ${response.status}`
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        adzunaTest = `ERROR: ${message}`
      }
    }

    // Test JSearch API
    let jsearchTest = 'NOT TESTED'
    if (process.env.JSEARCH_API_KEY) {
      try {
        const jsearchUrl = `https://jsearch.p.rapidapi.com/search?query=developer&page=1&num_pages=1`
        const response = await fetch(jsearchUrl, {
          headers: {
            'X-RapidAPI-Key': process.env.JSEARCH_API_KEY,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
          }
        })
        jsearchTest = response.ok ? 'SUCCESS' : `ERROR: ${response.status}`
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        jsearchTest = `ERROR: ${message}`
      }
    }

    return NextResponse.json({
      message: 'API Keys Debug',
      apiKeys,
      tests: {
        adzuna: adzunaTest,
        jsearch: jsearchTest
      },
      environment: process.env.NODE_ENV
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Debug failed'
    return NextResponse.json(
      { error: 'Debug failed', details: message },
      { status: 500 }
    )
  }
}
