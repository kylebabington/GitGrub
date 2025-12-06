import { createBrowserRouter, RouterProvider, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Explore } from './pages/Explore';
import { NewRepo } from './pages/NewRepo';
import { RepoView } from './pages/RepoView';
import { NewRecipe } from './pages/NewRecipe';
import { RecipeView } from './pages/RecipeView';
import { Settings } from './pages/Settings';
import { Trending } from './pages/Trending';
import { ForkRecipe } from './pages/ForkRecipe';
import { UserProfile } from './pages/UserProfile';
import { Notifications } from './pages/Notifications';
import { PullRequests } from './pages/PullRequests';
import { NewPullRequest } from './pages/NewPullRequest';
import { AdvancedSearch } from './pages/AdvancedSearch';
import { ShoppingList } from './pages/ShoppingList';
import { RecipeHistory } from './pages/RecipeHistory';
import { MealPlanner } from './pages/MealPlanner';
import { Achievements } from './pages/Achievements';
import { Analytics } from './pages/Analytics';
import { RecipeBranches } from './pages/RecipeBranches';
import { CookAlong } from './pages/CookAlong';
import { ScheduleCookAlong } from './pages/ScheduleCookAlong';
import { LiveCookAlong } from './pages/LiveCookAlong';
import { EditRecipe } from './pages/EditRecipe';
import { ImportRecipe } from './pages/ImportRecipe';
import { SelectRepository } from './pages/SelectRepository';
import { FridgeInventory } from './pages/FridgeInventory';
import { LeftoverMatcher } from './pages/LeftoverMatcher';
import { Features } from './pages/Features';
import { Pricing } from './pages/Pricing';
import { Docs } from './pages/Docs';
import { Guides } from './pages/Guides';
import { HelpCenter } from './pages/Help';
import { About } from './pages/About';
import { Blog } from './pages/Blog';
import { Contact } from './pages/Contact';
// Wrapper components using React Router's useParams hook
function RepoViewWrapper() {
  const { repoId } = useParams<{ repoId: string }>();
  if (!repoId) return <Navigate to="/" replace />;
  return <RepoView repoId={repoId} />;
}

function RecipeViewWrapper() {
  const { recipeId } = useParams<{ recipeId: string }>();
  if (!recipeId) return <Navigate to="/" replace />;
  return <RecipeView recipeId={recipeId} />;
}

function NewRecipeWrapper() {
  const [searchParams] = useSearchParams();
  const repoId = searchParams.get('repo');
  if (!repoId) return <Navigate to="/recipe/select-repo" replace />;
  return <NewRecipe repoId={repoId} />;
}

function NewRecipeFromRepoWrapper() {
  const { repoId } = useParams<{ repoId: string }>();
  if (!repoId) return <Navigate to="/recipe/select-repo" replace />;
  return <NewRecipe repoId={repoId} />;
}

function ForkRecipeWrapper() {
  const { recipeId } = useParams<{ recipeId: string }>();
  if (!recipeId) return <Navigate to="/" replace />;
  return <ForkRecipe recipeId={recipeId} />;
}

function PullRequestsWrapper() {
  const { recipeId } = useParams<{ recipeId: string }>();
  if (!recipeId) return <Navigate to="/" replace />;
  return <PullRequests recipeId={recipeId} />;
}

function NewPullRequestWrapper() {
  const { recipeId } = useParams<{ recipeId: string }>();
  if (!recipeId) return <Navigate to="/" replace />;
  return <NewPullRequest recipeId={recipeId} />;
}

function RecipeHistoryWrapper() {
  const { recipeId } = useParams<{ recipeId: string }>();
  if (!recipeId) return <Navigate to="/" replace />;
  return <RecipeHistory recipeId={recipeId} />;
}

function RecipeBranchesWrapper() {
  const { recipeId } = useParams<{ recipeId: string }>();
  if (!recipeId) return <Navigate to="/" replace />;
  return <RecipeBranches recipeId={recipeId} />;
}

function EditRecipeWrapper() {
  const { recipeId } = useParams<{ recipeId: string }>();
  if (!recipeId) return <Navigate to="/" replace />;
  return <EditRecipe recipeId={recipeId} />;
}

function LiveCookAlongWrapper() {
  const { sessionId } = useParams<{ sessionId: string }>();
  if (!sessionId) return <Navigate to="/cook-along" replace />;
  return <LiveCookAlong sessionId={sessionId} />;
}

function UserProfileWrapper() {
  const { username } = useParams<{ username: string }>();
  if (!username) return <Navigate to="/" replace />;
  return <UserProfile username={username} />;
}

export const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/explore', element: <Explore /> },
  { path: '/trending', element: <Trending /> },
  { path: '/search', element: <AdvancedSearch /> },
  { path: '/features', element: <Features /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/docs', element: <Docs /> },
  { path: '/guides', element: <Guides /> },
  { path: '/help', element: <HelpCenter /> },
  { path: '/about', element: <About /> },
  { path: '/blog', element: <Blog /> },
  { path: '/contact', element: <Contact /> },
  
  // Recipe viewing (public)
  { path: '/recipe/:recipeId', element: <RecipeViewWrapper /> },
  { path: '/recipe/:recipeId/history', element: <RecipeHistoryWrapper /> },
  { path: '/recipe/:recipeId/branches', element: <RecipeBranchesWrapper /> },
  { path: '/recipe/:recipeId/pull-requests', element: <PullRequestsWrapper /> },
  
  // Repo viewing (public)
  { path: '/repo/:repoId', element: <RepoViewWrapper /> },
  
  // Protected routes (require authentication)
  { 
    path: '/dashboard', 
    element: <ProtectedRoute><Dashboard /></ProtectedRoute> 
  },
  { 
    path: '/settings', 
    element: <ProtectedRoute><Settings /></ProtectedRoute> 
  },
  { 
    path: '/notifications', 
    element: <ProtectedRoute><Notifications /></ProtectedRoute> 
  },
  { 
    path: '/shopping-list', 
    element: <ProtectedRoute><ShoppingList /></ProtectedRoute> 
  },
  { 
    path: '/meal-planner', 
    element: <ProtectedRoute><MealPlanner /></ProtectedRoute> 
  },
  { 
    path: '/achievements', 
    element: <ProtectedRoute><Achievements /></ProtectedRoute> 
  },
  { 
    path: '/analytics', 
    element: <ProtectedRoute><Analytics /></ProtectedRoute> 
  },
  { 
    path: '/fridge', 
    element: <ProtectedRoute><FridgeInventory /></ProtectedRoute> 
  },
  { 
    path: '/recipe-matcher', 
    element: <ProtectedRoute><LeftoverMatcher /></ProtectedRoute> 
  },
  { 
    path: '/import', 
    element: <ProtectedRoute><ImportRecipe /></ProtectedRoute> 
  },
  
  // Recipe creation and editing (protected)
  { 
    path: '/repo/new', 
    element: <ProtectedRoute><NewRepo /></ProtectedRoute> 
  },
  { 
    path: '/recipe/select-repo', 
    element: <ProtectedRoute><SelectRepository /></ProtectedRoute> 
  },
  { 
    path: '/recipe/new', 
    element: <ProtectedRoute><NewRecipeWrapper /></ProtectedRoute> 
  },
  { 
    path: '/repo/:repoId/new-recipe', 
    element: <ProtectedRoute><NewRecipeFromRepoWrapper /></ProtectedRoute> 
  },
  { 
    path: '/recipe/:recipeId/fork', 
    element: <ProtectedRoute><ForkRecipeWrapper /></ProtectedRoute> 
  },
  { 
    path: '/recipe/:recipeId/edit', 
    element: <ProtectedRoute><EditRecipeWrapper /></ProtectedRoute> 
  },
  { 
    path: '/recipe/:recipeId/new-pr', 
    element: <ProtectedRoute><NewPullRequestWrapper /></ProtectedRoute> 
  },
  
  // Cook along (protected)
  { 
    path: '/cook-along', 
    element: <ProtectedRoute><CookAlong /></ProtectedRoute> 
  },
  { 
    path: '/cook-along/schedule', 
    element: <ProtectedRoute><ScheduleCookAlong /></ProtectedRoute> 
  },
  { 
    path: '/cook-along/:sessionId', 
    element: <ProtectedRoute><LiveCookAlongWrapper /></ProtectedRoute> 
  },
  
  // User profile (public, but catch-all - must be last)
  { path: '/:username', element: <UserProfileWrapper /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

