import { Layout } from '../components/Layout';

export function Features() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Features</h1>
        <p className="text-gray-600">
          Learn about what GitGrub can do for your cooking workflow. Detailed feature breakdown coming soon.
        </p>
      </div>
    </Layout>
  );
}
