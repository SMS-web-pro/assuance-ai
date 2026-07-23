import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { LayoutDashboard, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminUsersManager from '@/components/admin/AdminUsersManager';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navigation = [
    { name: 'Tableau de bord', icon: LayoutDashboard, href: '#', current: activeTab === 'dashboard' },
    { name: 'Utilisateurs', icon: Users, href: '#', current: activeTab === 'users' },
    { name: 'Paramètres', icon: Settings, href: '#', current: activeTab === 'settings' },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile menu */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
            <h1 className="text-xl font-bold text-gray-900">Administration</h1>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="bg-white shadow-md">
              <nav className="px-2 pt-2 pb-4 space-y-1">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(item.name.toLowerCase().replace(' ', ''));
                      setMobileMenuOpen(false);
                    }}
                    className={`${item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-3 py-2 text-base font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                ))}
                <button
                  onClick={handleSignOut}
                  className="w-full text-left text-red-600 hover:bg-gray-50 group flex items-center px-3 py-2 text-base font-medium rounded-md"
                >
                  <LogOut className="text-red-500 mr-3 h-6 w-6" aria-hidden="true" />
                  Déconnexion
                </button>
              </nav>
            </div>
          )}
        </div>

        <div className="lg:flex">
          {/* Sidebar */}
          <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4">
                  <h1 className="text-xl font-bold text-gray-900">Administration</h1>
                </div>
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(item.name.toLowerCase().replace(' ', ''));
                      }}
                      className={`${item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <item.icon
                        className={`${item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <button
                  onClick={handleSignOut}
                  className="flex-shrink-0 w-full group block"
                >
                  <div className="flex items-center">
                    <div>
                      <LogOut className="h-6 w-6 text-red-500 group-hover:text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600 group-hover:text-red-700">
                        Déconnexion
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto focus:outline-none">
            <main className="flex-1 relative pb-8 z-0">
              <div className="bg-white shadow">
                <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8">
                  <div className="py-6 md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {activeTab === 'dashboard' && 'Tableau de bord'}
                        {activeTab === 'users' && 'Gestion des administrateurs'}
                        {activeTab === 'settings' && 'Paramètres'}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {activeTab === 'dashboard' && (
                    <div className="bg-white shadow rounded-lg p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Bienvenue dans l'administration</h2>
                      <p className="text-gray-600">
                        Utilisez le menu de navigation pour gérer les différentes sections de l'administration.
                      </p>
                    </div>
                  )}
                  
                  {activeTab === 'users' && <AdminUsersManager />}
                  
                  {activeTab === 'settings' && (
                    <div className="bg-white shadow rounded-lg p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Paramètres</h2>
                      <p className="text-gray-600">
                        Les paramètres seront disponibles prochainement.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
