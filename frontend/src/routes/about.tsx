import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold underline">About Page</h1>
      <p className="mt-4">This is the about page using TanStack React Router.</p>
      <p className="mt-2">Learn more about our application here.</p>
    </div>
  )
} 