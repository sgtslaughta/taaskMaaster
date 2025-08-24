import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function Home() {
  const [apiStatus, setApiStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check API health
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
        if (response.ok) {
          const data = await response.json()
          setApiStatus(data)
        } else {
          setApiStatus({ status: 'error', message: 'API not responding' })
        }
      } catch (error) {
        setApiStatus({ status: 'error', message: error.message })
      } finally {
        setLoading(false)
      }
    }

    checkApiHealth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{process.env.NEXT_PUBLIC_APP_NAME} - Task Management for Families</title>
        <meta name="description" content="A comprehensive task management system designed to help parents encourage children to complete household tasks through gamification and rewards." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to TaaskMaaster
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            A comprehensive task management system for families
          </p>

          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              System Status
            </h2>
            
            {loading ? (
              <div className="text-blue-600">Checking system status...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Frontend:</span>
                  <span className="text-green-600 font-semibold">✅ Running</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Backend API:</span>
                  <span className={`font-semibold ${
                    apiStatus?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {apiStatus?.status === 'healthy' ? '✅ Healthy' : '❌ Error'}
                  </span>
                </div>
                
                {apiStatus?.version && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">API Version:</span>
                    <span className="text-gray-600">{apiStatus.version}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Task Management
                </h3>
                <p className="text-gray-600">
                  Create, assign, and track tasks with flexible options and deadlines.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Gamification
                </h3>
                <p className="text-gray-600">
                  Points, achievements, and rewards to motivate task completion.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Family Focused
                </h3>
                <p className="text-gray-600">
                  Designed specifically for families to work together.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              API Documentation: <a href={`${process.env.NEXT_PUBLIC_API_URL}/docs`} className="text-blue-600 hover:underline">View Docs</a>
            </p>
            <p>
              Health Check: <a href={`${process.env.NEXT_PUBLIC_API_URL}/health`} className="text-blue-600 hover:underline">View Status</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
