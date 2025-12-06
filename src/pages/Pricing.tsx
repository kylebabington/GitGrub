import { Layout } from '../components/Layout';

export function Pricing() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Pricing</h1>
        <p className="text-gray-600 mb-4">
          GitGrub is currently in development. Final pricing and plan details are coming soon.
        </p>
        <p className="text-gray-600">
          For now, consider this a preview environment for exploring the product concept.
        </p>
      </div>
    </Layout>
  );
}
