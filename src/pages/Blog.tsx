import { Layout } from '../components/Layout';

export function Blog() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog</h1>
        <p className="text-gray-600 mb-4">
          Future product updates, launch notes, and long-form content can live here.
        </p>
        <p className="text-gray-600">
          For now, this is a simple placeholder route so navigation feels complete.
        </p>
      </div>
    </Layout>
  );
}
