import { Layout } from '../components/Layout';

export function Guides() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Guides</h1>
        <p className="text-gray-600 mb-4">
          Step-by-step guides and best practices for getting the most out of GitGrub will appear here.
        </p>
        <p className="text-gray-600">
          Think of this as a future home for onboarding flows, tutorials, and recipe workflow examples.
        </p>
      </div>
    </Layout>
  );
}
