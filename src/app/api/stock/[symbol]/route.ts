import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  // Security: Verify user is authenticated
  const session = await getServerSession()
  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please sign in' },
      { status: 401 }
    )
  }

  const { symbol } = params
  
  // Security: Validate symbol format (1-5 uppercase letters)
  if (!symbol || !/^[A-Z]{1,5}$/.test(symbol.toUpperCase())) {
    return NextResponse.json(
      { error: 'Invalid symbol format. Must be 1-5 uppercase letters.' },
      { status: 400 }
    )
  }

  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY

  if (!API_KEY) {
    console.error('Alpha Vantage API key not configured')
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }

  try {
    // Get current quote
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    const quoteResponse = await fetch(quoteUrl)
    const quoteData = await quoteResponse.json()

    // Check for API limit or error
    if (quoteData['Error Message']) {
      return NextResponse.json(
        { error: 'Invalid symbol or API error' },
        { status: 400 }
      )
    }

    if (quoteData['Note']) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const quote = quoteData['Global Quote']
    if (!quote || !quote['05. price']) {
      return NextResponse.json(
        { error: 'No data available for this symbol' },
        { status: 404 }
      )
    }

    // Get historical data (daily)
    const historicalUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`
    const historicalResponse = await fetch(historicalUrl)
    const historicalData = await historicalResponse.json()

    const timeSeries = historicalData['Time Series (Daily)']
    const historical = timeSeries ? Object.entries(timeSeries).slice(0, 30).map(([date, data]: [string, any]) => ({
      date,
      price: parseFloat(data['4. close'])
    })) : []

    return NextResponse.json({
      symbol: quote['01. symbol'],
      currentPrice: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'].replace('%', ''),
      lastUpdated: quote['07. latest trading day'],
      historical: historical.reverse() // Oldest to newest
    })

  } catch (error) {
    console.error('Error fetching stock data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}