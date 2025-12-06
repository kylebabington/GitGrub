import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">GitGrub</h3>
              <p className="text-sm text-gray-600">
                Git in my belly. The collaborative recipe platform with version control.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/features" className="hover:text-emerald-600">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-emerald-600">Pricing</Link></li>
                <li><Link to="/explore" className="hover:text-emerald-600">Explore</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/docs" className="hover:text-emerald-600">Documentation</Link></li>
                <li><Link to="/guides" className="hover:text-emerald-600">Guides</Link></li>
                <li><Link to="/help" className="hover:text-emerald-600">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/about" className="hover:text-emerald-600">About</Link></li>
                <li><Link to="/blog" className="hover:text-emerald-600">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-emerald-600">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>&copy; 2025 GitGrub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
