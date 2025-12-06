import { Layout } from '../components/Layout';

export function Contact() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact</h1>
        <p className="text-gray-600 mb-4">
          A future contact form or support email can go here.
        </p>
        <p className="text-gray-600">
          For now, this page exists so the footer navigation never leads to a dead end.
        </p>
      </div>
    </Layout>
  );
}
