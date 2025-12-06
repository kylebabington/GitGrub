import { Layout } from '../components/Layout';

export function HelpCenter() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Help Center</h1>
        <p className="text-gray-600 mb-4">
          Need help with GitGrub? This is where FAQs, troubleshooting tips, and support links will live.
        </p>
        <p className="text-gray-600">
          For now, treat this as a placeholder while the support experience is being built out.
        </p>
      </div>
    </Layout>
  );
}
