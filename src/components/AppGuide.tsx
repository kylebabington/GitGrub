import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export function AppGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
      >
        <BookOpen size={18} />
        <span className="font-medium">App Guide</span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
            <div className="sticky top-0 bg-emerald-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen size={32} />
                  <div>
                    <h2 className="text-2xl font-bold">GitGrub User Guide</h2>
                    <p className="text-emerald-100 text-sm">Everything you need to know</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-emerald-100 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8 prose prose-emerald max-w-none">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-600 p-4 rounded-r-lg mb-6">
                <p className="text-lg font-semibold text-emerald-900 mb-2">
                  Welcome to GitGrub!
                </p>
                <p className="text-emerald-800 mb-0">
                  GitGrub is a collaborative recipe platform that brings version control to cooking.
                  Think GitHub, but for recipes. Fork, remix, collaborate, and track every change.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-emerald-200 pb-2">
                🍳 Core Concepts
              </h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Repositories</h3>
              <p className="text-gray-700 mb-3">
                Repositories are collections of related recipes. Create a public repo to share with everyone,
                or a private repo for personal use.
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li><strong>Public Repos:</strong> Visible to everyone, great for sharing your culinary creations</li>
                <li><strong>Private Repos:</strong> Your secret recipes, only you can access</li>
                <li><strong>Organization:</strong> Group recipes by cuisine, meal type, or occasion</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Forking</h3>
              <p className="text-gray-700 mb-3">
                Found a recipe you like but want to tweak it? Fork it to your own repository!
                This creates a copy you can modify while preserving the original.
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Click "Fork" on any recipe</li>
                <li>Choose which repository to fork it into</li>
                <li>Make your changes</li>
                <li>Your version is tracked separately</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Pull Requests</h3>
              <p className="text-gray-700 mb-3">
                Think you've improved a recipe? Submit a pull request to the original creator!
                They can review your changes and merge them if they agree.
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Fork a recipe and make improvements</li>
                <li>Click "New Pull Request"</li>
                <li>Describe your changes</li>
                <li>Owner reviews and can merge or comment</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-emerald-200 pb-2">
                🎯 Getting Started
              </h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Create Your Account</h3>
              <p className="text-gray-700 mb-3">
                Sign up with your email and password. You'll get instant access to all features.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Browse Recipes</h3>
              <p className="text-gray-700 mb-3">
                Navigate to <strong>Explore</strong> to discover recipes from the community:
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Search by name, ingredients, or tags</li>
                <li>Filter by dietary preferences (vegan, keto, etc.)</li>
                <li>Sort by popularity or newest</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Create Your First Repository</h3>
              <p className="text-gray-700 mb-3">
                Click "New Repo" in your dashboard:
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Give it a name (e.g., "Italian Favorites")</li>
                <li>Add a description</li>
                <li>Choose public or private</li>
                <li>Click Create</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Add Your First Recipe</h3>
              <p className="text-gray-700 mb-3">
                Inside your repo, click "New Recipe":
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Enter title and description</li>
                <li>Add ingredients with quantities</li>
                <li>Write step-by-step instructions</li>
                <li>Upload a hero image</li>
                <li>Add tags for discoverability</li>
                <li>Set prep/cook times and servings</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-emerald-200 pb-2">
                ✨ New Smart Features
              </h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">📊 Interactive Progress Tracking</h3>
              <p className="text-gray-700 mb-3">
                When cooking a recipe, track your progress visually:
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Click step numbers to mark complete</li>
                <li>Progress bar shows completion percentage</li>
                <li>Completed steps fade and show checkmarks</li>
                <li>Get motivational messages ("Almost done!")</li>
                <li>Confetti celebration when finished 🎉</li>
                <li>Progress auto-saves - resume anytime</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">⏰ Smart Timers</h3>
              <p className="text-gray-700 mb-3">
                Timers are automatically detected in recipe steps:
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Any time mention becomes a clickable timer button</li>
                <li>Example: "Bake for 25 minutes" → Click to start timer</li>
                <li>Run multiple timers simultaneously</li>
                <li>Floating widget shows countdown</li>
                <li>Browser notifications when time's up</li>
                <li>Pause, reset, or restart anytime</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">🔄 Ingredient Substitutions</h3>
              <p className="text-gray-700 mb-3">
                Click the info icon (ℹ️) next to any ingredient:
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>See instant substitution suggestions</li>
                <li>Filter by dietary needs (vegan, keto, gluten-free)</li>
                <li>Community-voted confidence scores</li>
                <li>Automatic quantity conversion</li>
                <li>One-click to swap ingredient</li>
                <li>Examples: butter→coconut oil, egg→flax egg, milk→oat milk</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">📚 Quick Collections</h3>
              <p className="text-gray-700 mb-3">
                Organize recipes into collections:
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Click "Save" button on any recipe</li>
                <li>Choose from existing collections or create new</li>
                <li>Pre-made collections: Weeknight Dinners, Date Night, Kids Love, etc.</li>
                <li>Color-coded for easy identification</li>
                <li>See recipe counts per collection</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">🗓️ Cook Tonight Button</h3>
              <p className="text-gray-700 mb-3">
                Quick meal planning:
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Click "Cook Tonight" on any recipe</li>
                <li>Automatically adds to today's dinner</li>
                <li>Integrates with meal planner</li>
                <li>Visual confirmation animation</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-emerald-200 pb-2">
                🛠️ All Features
              </h2>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Recipe Management</h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>✅ Create, edit, and delete recipes</li>
                <li>✅ Upload images for recipes</li>
                <li>✅ Add ingredients with quantities</li>
                <li>✅ Step-by-step instructions</li>
                <li>✅ Tags and categories</li>
                <li>✅ Prep/cook times and servings</li>
                <li>✅ Public/private visibility</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Version Control</h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>✅ Fork recipes to your own repository</li>
                <li>✅ View complete recipe history</li>
                <li>✅ See diffs between versions</li>
                <li>✅ Track who changed what and when</li>
                <li>✅ Revert to previous versions</li>
                <li>✅ Branch management (create variations)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Collaboration</h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>✅ Submit pull requests</li>
                <li>✅ Review and merge contributions</li>
                <li>✅ Comment on recipes</li>
                <li>✅ Rate recipes (1-5 stars)</li>
                <li>✅ Star favorites</li>
                <li>❌ <strong>Live Cook-Along (Coming Soon)</strong> - Cook together in real-time</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Meal Planning</h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>✅ Weekly meal planner</li>
                <li>✅ Drag-and-drop scheduling</li>
                <li>✅ Auto-generate shopping lists</li>
                <li>✅ Cook Tonight quick-add</li>
                <li>✅ Track planned vs cooked meals</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Smart Kitchen Tools</h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>✅ Recipe scaler (adjust servings)</li>
                <li>✅ Ingredient substitutions</li>
                <li>✅ Smart timers</li>
                <li>✅ Progress tracking</li>
                <li>✅ Equipment manager</li>
                <li>✅ Fridge inventory</li>
                <li>✅ Leftover matcher (find recipes using ingredients you have)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Discovery</h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>✅ Explore public recipes</li>
                <li>✅ Trending recipes</li>
                <li>✅ Advanced search with filters</li>
                <li>✅ Full-text search</li>
                <li>✅ Import recipes from URLs</li>
                <li>✅ Recipe recommendations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Gamification</h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>✅ Achievement system</li>
                <li>✅ XP and leveling</li>
                <li>✅ Cooking streaks</li>
                <li>✅ Badges for milestones</li>
                <li>✅ Profile statistics</li>
                <li>✅ Leaderboards</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Analytics</h3>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>✅ Personal cooking analytics</li>
                <li>✅ Recipe popularity metrics</li>
                <li>✅ Usage statistics</li>
                <li>✅ Favorite cuisines and ingredients</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-emerald-200 pb-2">
                📱 Page Navigation
              </h2>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <strong className="text-gray-900">Dashboard:</strong>
                  <span className="text-gray-700"> Your personal homepage with recent activity</span>
                </div>
                <div>
                  <strong className="text-gray-900">Explore:</strong>
                  <span className="text-gray-700"> Browse all public recipes</span>
                </div>
                <div>
                  <strong className="text-gray-900">Trending:</strong>
                  <span className="text-gray-700"> Popular recipes this week</span>
                </div>
                <div>
                  <strong className="text-gray-900">Search:</strong>
                  <span className="text-gray-700"> Advanced search with filters</span>
                </div>
                <div>
                  <strong className="text-gray-900">Meal Planner:</strong>
                  <span className="text-gray-700"> Plan your weekly meals</span>
                </div>
                <div>
                  <strong className="text-gray-900">Achievements:</strong>
                  <span className="text-gray-700"> Track your cooking milestones</span>
                </div>
                <div>
                  <strong className="text-gray-900">Cook-Along:</strong>
                  <span className="text-gray-700"> Join live cooking sessions (Coming Soon)</span>
                </div>
                <div>
                  <strong className="text-gray-900">Import:</strong>
                  <span className="text-gray-700"> Import recipes from other websites</span>
                </div>
                <div>
                  <strong className="text-gray-900">Fridge Inventory:</strong>
                  <span className="text-gray-700"> Track what's in your kitchen</span>
                </div>
                <div>
                  <strong className="text-gray-900">Shopping List:</strong>
                  <span className="text-gray-700"> Auto-generated from meal plans</span>
                </div>
                <div>
                  <strong className="text-gray-900">Notifications:</strong>
                  <span className="text-gray-700"> Activity updates and alerts</span>
                </div>
                <div>
                  <strong className="text-gray-900">Settings:</strong>
                  <span className="text-gray-700"> Manage your profile and preferences</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-emerald-200 pb-2">
                💡 Pro Tips
              </h2>

              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg space-y-3">
                <p className="text-gray-800 mb-0">
                  <strong>🔍 Quick Search:</strong> Use the search bar in the header to instantly find recipes
                </p>
                <p className="text-gray-800 mb-0">
                  <strong>⭐ Star Recipes:</strong> Starred recipes appear in your favorites for easy access
                </p>
                <p className="text-gray-800 mb-0">
                  <strong>🍴 Recipe Scaling:</strong> Use the scaler in recipe view to adjust serving sizes
                </p>
                <p className="text-gray-800 mb-0">
                  <strong>📝 Chef's Notes:</strong> Add personal notes to any recipe you fork
                </p>
                <p className="text-gray-800 mb-0">
                  <strong>🔔 Enable Notifications:</strong> Get alerted when timers complete
                </p>
                <p className="text-gray-800 mb-0">
                  <strong>📊 Track Progress:</strong> Mark steps as you cook to stay organized
                </p>
                <p className="text-gray-800 mb-0">
                  <strong>🔄 Try Substitutions:</strong> Click info icons on ingredients for dietary alternatives
                </p>
                <p className="text-gray-800 mb-0">
                  <strong>📚 Use Collections:</strong> Organize recipes by occasion or cuisine type
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-emerald-200 pb-2">
                ⚠️ Features Not Yet Operational
              </h2>

              <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded-r-lg">
                <p className="text-gray-800 font-semibold mb-3">Coming Soon:</p>
                <ul className="text-gray-700 space-y-2 ml-4">
                  <li>❌ <strong>Live Cook-Along Sessions:</strong> Real-time cooking with friends</li>
                  <li>❌ <strong>Video Uploads:</strong> Add cooking videos to recipes</li>
                  <li>❌ <strong>Social Features:</strong> Follow users, activity feed</li>
                  <li>❌ <strong>Recipe Battles:</strong> Competitive cooking tournaments</li>
                  <li>❌ <strong>AI Recipe Suggestions:</strong> Personalized recommendations</li>
                  <li>❌ <strong>Nutritional Info:</strong> Auto-calculated nutrition facts</li>
                  <li>❌ <strong>Print Mode:</strong> Printer-friendly recipe cards</li>
                  <li>❌ <strong>Mobile App:</strong> Native iOS and Android apps</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-emerald-200 pb-2">
                🆘 Need Help?
              </h2>

              <p className="text-gray-700 mb-4">
                If you encounter any issues or have questions:
              </p>
              <ul className="text-gray-700 space-y-2 ml-4">
                <li>Check your browser console for error messages</li>
                <li>Make sure you're logged in for full features</li>
                <li>Try refreshing the page</li>
                <li>Clear your browser cache if things look broken</li>
                <li>Some features require authentication - sign up to access</li>
              </ul>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 text-center mt-8">
                <p className="text-xl font-semibold text-emerald-900 mb-2">
                  Happy Cooking! 🎉
                </p>
                <p className="text-emerald-800">
                  GitGrub makes cooking collaborative, trackable, and fun.
                  Start creating, forking, and sharing your recipes today!
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
