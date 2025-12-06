import { Star, Users, TrendingUp, Code, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { AppGuide } from '../components/AppGuide';
import logoFull from '../assests/GitGrubForkLogo.png';
import logoIcon from '../assests/ForkLogo.png';

export function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center items-center gap-4 mb-8">
              <AppGuide />
            </div>
            
            {/* Hero Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src={logoFull} 
                alt="GitGrub" 
                className="h-24 sm:h-32 w-auto drop-shadow-lg"
              />
            </div>
            
            <p className="text-2xl sm:text-3xl text-gray-600 mb-4 font-medium">
              Git in my belly.
            </p>
            <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              The collaborative recipe platform with version control. Fork recipes, propose improvements, and build your culinary legacy.
            </p>
            <div className="flex gap-4 justify-center">
              {user ? (
                <Button size="lg" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate('/signup')}>
                    Get Started Free
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => navigate('/explore')}
                  >
                    Explore Recipes
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why GitGrub?
            </h2>
            <p className="text-xl text-gray-600">
              Bring the power of version control to your kitchen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6 p-3">
                <img src={logoIcon} alt="Fork" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Fork & Remix</h3>
              <p className="text-gray-600">
                Found a great recipe? Fork it to your collection and remix it to perfection. Every change is tracked with full version history.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <Code className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Version Control</h3>
              <p className="text-gray-600">
                Track every ingredient change, every step modification. View diffs, revert to previous versions, and see your recipe evolve over time.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Collaborate</h3>
              <p className="text-gray-600">
                Submit pull requests to improve recipes, discuss changes, and build a community around shared culinary knowledge.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
                <Star className="text-orange-600" size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Star Favorites</h3>
              <p className="text-gray-600">
                Star recipes you love and follow your favorite chefs. Build your personal cookbook with recipes that inspire you.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-6">
                <TrendingUp className="text-pink-600" size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Discover Trends</h3>
              <p className="text-gray-600">
                See what's trending in the culinary world. Find recipes by ingredients, dietary needs, or cooking style.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-6">
                <BookOpen className="text-teal-600" size={32} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Recipe Repos</h3>
              <p className="text-gray-600">
                Organize recipes into themed collections. Create public cookbooks or keep your secret recipes private.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Just like GitHub, but for recipes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                1
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Create</h4>
              <p className="text-gray-600">Create a recipe repo and add your recipes with our standardized format</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                2
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Share</h4>
              <p className="text-gray-600">Share your recipes with the community and get feedback from other chefs</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                3
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Fork</h4>
              <p className="text-gray-600">Fork recipes you love and customize them to your taste preferences</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                4
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Improve</h4>
              <p className="text-gray-600">Submit pull requests to suggest improvements to any public recipe</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to revolutionize your recipes?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of chefs collaborating on GitGrub
          </p>
          <Button size="lg" onClick={() => navigate('/signup')}>
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
}
