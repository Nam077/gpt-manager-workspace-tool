import { createFileRoute } from '@tanstack/react-router'
import {
  EnvelopeIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  UserIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <UserIcon className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <SparklesIcon className="w-8 h-8 text-yellow-500 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">About Developer</h1>
          <p className="text-xl text-gray-600">Full Stack Developer & Open Source Enthusiast</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Bio Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <CodeBracketIcon className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">About This Project</h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <p>
                This is a comprehensive GPT Manager Workspace Tool designed to streamline 
                AI model management and workspace organization. Built with modern technologies 
                to provide an efficient and user-friendly experience.
              </p>
              <p>
                The application features cookie management, workspace tools, and various 
                utilities to enhance productivity in AI development workflows.
              </p>
              <div className="flex items-center mt-6 p-4 bg-blue-50 rounded-lg">
                <HeartIcon className="w-6 h-6 text-red-500 mr-2" />
                <span className="text-blue-800 font-medium">Made with love and dedication</span>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <EnvelopeIcon className="w-8 h-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Get In Touch</h2>
            </div>
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-center group">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-red-200 transition-colors">
                  <EnvelopeIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a 
                    href="mailto:nam077.contact@gmail.com"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    nam077.contact@gmail.com
                  </a>
                </div>
              </div>

              {/* Facebook */}
              <div className="flex items-center group">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Facebook</p>
                  <a 
                    href="https://www.facebook.com/Nam077.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    facebook.com/Nam077.me
                  </a>
                </div>
              </div>

              {/* GitHub */}
              <div className="flex items-center group">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-gray-200 transition-colors">
                  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">GitHub</p>
                  <a 
                    href="https://github.com/Nam077"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    github.com/Nam077
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <GlobeAltIcon className="w-8 h-8 text-purple-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Technology Stack</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'React', color: 'bg-blue-100 text-blue-800' },
              { name: 'TypeScript', color: 'bg-blue-100 text-blue-800' },
              { name: 'TailwindCSS', color: 'bg-cyan-100 text-cyan-800' },
              { name: 'Node.js', color: 'bg-green-100 text-green-800' },
              { name: 'TanStack Router', color: 'bg-orange-100 text-orange-800' },
              { name: 'React Query', color: 'bg-red-100 text-red-800' },
              { name: 'Heroicons', color: 'bg-purple-100 text-purple-800' },
              { name: 'Vite', color: 'bg-yellow-100 text-yellow-800' }
            ].map((tech, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-lg text-center font-medium ${tech.color} transition-transform hover:scale-105`}
              >
                {tech.name}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            © 2024 GPT Manager Workspace Tool. Built with passion for the developer community.
          </p>
          <div className="flex justify-center items-center mt-4 space-x-2">
            <HeartIcon className="w-5 h-5 text-red-500" />
            <span className="text-gray-500">Thank you for using our application!</span>
          </div>
        </div>
      </div>
    </div>
  )
}