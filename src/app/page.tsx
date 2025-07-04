import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

/**
 * Home page component
 *
 * @returns Home page JSX
 */
export default function Home() {
  const today = new Date()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Sample App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            今日は{formatDate(today)}です
          </p>
          <div className="space-x-4">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
