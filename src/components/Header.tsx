import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Settings, Plus, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import logoFull from '../assests/GitGrubForkLogo.png';
import logoIcon from '../assests/ForkLogo.png';

export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              {/* Full logo on desktop, icon only on mobile */}
              <img 
                src={logoFull} 
                alt="GitGrub" 
                className="hidden sm:block h-10 w-auto"
              />
              <img 
                src={logoIcon} 
                alt="GitGrub" 
                className="sm:hidden h-9 w-auto"
              />
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/explore" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                Explore
              </Link>
              <Link to="/trending" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                Trending
              </Link>
              <Link to="/search" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                Search
              </Link>
              <Link to="/meal-planner" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                Meal Planner
              </Link>
              <Link to="/achievements" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                Achievements
              </Link>
              <Link to="/cook-along" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                Cook-Along
              </Link>
              <Link to="/import" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">
                Import
              </Link>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search recipes, ingredients, or chefs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-700 hover:text-emerald-600"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/notifications')}
                  className="relative p-2 text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User size={20} className="text-emerald-600" />
                      </div>
                    )}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-semibold text-gray-900">{profile?.username}</p>
                        {profile?.is_pro && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded">
                            PRO
                          </span>
                        )}
                      </div>
                      <Link
                        to={profile ? `/${profile.username}` : '#'}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} />
                        Your Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 border-t border-gray-200 mt-2 pt-2"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 pb-4">
            <div className="py-2 space-y-1">
              <Link
                to="/explore"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Explore
              </Link>
              <Link
                to="/trending"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Trending
              </Link>
              <Link
                to="/search"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Search
              </Link>
              <Link
                to="/meal-planner"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Meal Planner
              </Link>
              <Link
                to="/fridge"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Fridge
              </Link>
              <Link
                to="/recipe-matcher"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Recipe Matcher
              </Link>
              <Link
                to="/achievements"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Achievements
              </Link>
              <Link
                to="/cook-along"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Cook-Along
              </Link>
              <Link
                to="/import"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Import Recipe
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
