import { Layout } from '../components/Layout';

export function About() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">About GitGrub</h1>
        <p className="text-gray-600 mb-4">
          GitGrub is an experiment in bringing version control concepts to the kitchen.
        </p>
        <p className="text-gray-600">
          GitGrub is for all those people who love experimenting in the kitchen and hate having to search through a blog to find the recipe.
        </p>
      </div>
    </Layout>
  );
}
