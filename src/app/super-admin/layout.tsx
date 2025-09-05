import Link from 'next/link';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/super-admin" className="text-xl font-bold text-purple-600">
                BeautyPoints Admin
              </Link>
              <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                Super Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin Panel
              </Link>
              <Link 
                href="/client" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Cliente
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
