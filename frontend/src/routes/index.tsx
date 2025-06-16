import { createFileRoute, Link } from '@tanstack/react-router'
import { 
  ServerIcon, 
  DocumentTextIcon, 
  GlobeAltIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const features = [
    {
      title: 'Workspace Management',
      description: 'Create and manage workspaces with member assignments and slot tracking',
      icon: ServerIcon,
      link: '/workspace',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Activity Logs',
      description: 'Monitor system activities and track important events in real-time',
      icon: DocumentTextIcon,
      link: '/logs',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Cookie Management',
      description: 'Manage cookies and session data with domain-based organization',
      icon: GlobeAltIcon,
      link: '/cookies',
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  const stats = [
    {
      title: 'Total Workspaces',
      value: '12',
      change: '+2 this week',
      icon: ServerIcon,
      color: 'text-blue-600'
    },
    {
      title: 'Active Members',
      value: '45',
      change: '+8 this month',
      icon: UserGroupIcon,
      color: 'text-green-600'
    },
    {
      title: 'System Health',
      value: '99.8%',
      change: 'Uptime',
      icon: ChartBarIcon,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              GPT Manager
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Workspace Hub
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your workspace and member management with our comprehensive platform. 
              Monitor activities, manage cookies, and track system performance all in one place.
            </p>
            <Link
              to="/workspace"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Started
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full bg-gray-100`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your workspaces, members, and system activities efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {feature.description}
              </p>
              <div className="flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
                Learn more
                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <p className="text-gray-600">
              Jump straight to the most commonly used features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/workspace"
              className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors group"
            >
              <ServerIcon className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Workspaces</h3>
                <p className="text-sm text-gray-600">Manage all workspaces</p>
              </div>
            </Link>
            
            <Link
              to="/logs"
              className="flex items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-colors group"
            >
              <DocumentTextIcon className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600">View Logs</h3>
                <p className="text-sm text-gray-600">System activities</p>
              </div>
            </Link>
            
            <Link
              to="/cookies"
              className="flex items-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-colors group"
            >
              <GlobeAltIcon className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">Cookies</h3>
                <p className="text-sm text-gray-600">Manage cookies</p>
              </div>
            </Link>
            
            <div className="flex items-center p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
              <CogIcon className="h-8 w-8 text-gray-600 mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 