'use client'

import { useEffect, useState } from "react"
import axios from "axios"
import PlaygroundChat from "./components/PlaygroundChat"
import { Code2, Bot, Loader2, RefreshCw } from 'lucide-react'

export default function Home() {
  const [models, setModels] = useState<{ id: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openaiModels, setOpenaiModels] = useState<any[]>([]);
  
  const getModels = async () => {
    try {
      setLoading(true)
      const response = await axios.get("https://api.groq.com/openai/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
        },
      })
      const sortedModels = response.data.data.sort((a: any, b: any) => a.id.localeCompare(b.id))
      setModels(sortedModels)
      setError(null)
    } catch (error) {
      setError("Failed to fetch models. Please try again later.")
      console.error("Error fetching models:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOpenAIModels = async () => {
    try {
      setLoading(true)
      const response = await axios.get("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
      });
      const sortedModels = response.data.data.sort((a: any, b: any) => a.id.localeCompare(b.id))
      setOpenaiModels(sortedModels);
    } catch (error) {
      console.error("Failed to fetch OpenAI models:", error);
    }finally{
      setLoading(false)
    }
  };
  

  useEffect(() => {
    getModels()
    fetchOpenAIModels()
  }, [])


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        {/* Header */}
        <header className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
                  AI Models Playground
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Experiment with cutting-edge AI models
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-full shadow-md">
                <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                  {models.length} Models Available
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="pt-2">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-lg">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
                <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">
                  Loading models...
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 px-4">
              <div className="text-center bg-white dark:bg-gray-800 px-8 py-6 rounded-lg shadow-lg w-full sm:w-auto">
                <p className="text-red-500 dark:text-red-400 mb-4 font-medium text-sm">
                  {error}
                </p>
                <button
                  onClick={getModels}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <RefreshCw className="w-5 h-5 mr-2 inline-block" />
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
              <div className="">
                <PlaygroundChat models={models} openaiModels={openaiModels} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
