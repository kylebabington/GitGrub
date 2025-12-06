import { Layout } from '../components/Layout';

export function Docs() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Documentation</h1>
        <p className="text-gray-600 mb-4">
          Developer and power-user documentation will live here.
        </p>
        <p className="text-gray-600">
          In the meantime, explore the app to get a feel for how GitGrub works end-to-end.
        </p>
      </div>
    </Layout>
  );
}
