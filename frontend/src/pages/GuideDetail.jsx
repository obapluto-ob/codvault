import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { tipsApi } from '../lib/api';
import { Spinner, SeoHead } from '../components/ui';

const DIFF_COLOR = { beginner: 'text-cod-green', intermediate: 'text-cod-accent', advanced: 'text-cod-red' };

export default function GuideDetail() {
  const { slug } = useParams();
  const { data: tip, isLoading, isError } = useQuery({
    queryKey: ['tip', slug],
    queryFn: () => tipsApi.get(slug),
  });

  if (isLoading) return <Spinner />;
  if (isError || !tip) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-cod-red mb-4">Guide not found.</p>
      <Link to="/guides" className="btn-ghost">← Back to Guides</Link>
    </div>
  );

  return (
    <>
      <SeoHead title={tip.title} description={tip.content.slice(0, 160)} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/guides" className="inline-flex items-center gap-1.5 text-cod-muted hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Guides
        </Link>

        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge-info">{tip.category}</span>
            <span className={`text-xs font-semibold ${DIFF_COLOR[tip.difficulty] || 'text-cod-muted'}`}>
              {tip.difficulty}
            </span>
            <span className="text-cod-muted text-xs ml-auto">
              {new Date(tip.created_at).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-4">{tip.title}</h1>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed [&_h2]:text-white [&_h2]:font-bold [&_h2]:text-base [&_h2]:mt-4 [&_h2]:mb-2 [&_strong]:text-white [&_p]:text-cod-muted [&_ul]:text-cod-muted [&_li]:mb-1">
            <ReactMarkdown>{tip.content}</ReactMarkdown>
          </div>
          {tip.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-cod-border">
              {tip.tags.map(tag => (
                <span key={tag} className="text-xs text-cod-muted bg-cod-surface px-2 py-1 rounded-lg">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
