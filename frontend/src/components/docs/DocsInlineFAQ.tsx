import React from 'react';

type DocsInlineFAQItem = {
  question: string;
  answer: React.ReactNode;
};

interface DocsInlineFAQProps {
  title?: string;
  items: DocsInlineFAQItem[];
}

const DocsInlineFAQ: React.FC<DocsInlineFAQProps> = ({ title = 'FAQ', items }) => {
  if (!items.length) return null;

  return (
    <section className="mt-12 border-t border-white/5 pt-8 space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((item, index) => (
          <details
            key={index}
            className="group rounded-md border border-white/5 bg-white/[0.02] text-xs text-slate-300"
          >
            <summary className="flex items-center justify-between cursor-pointer px-4 py-2 select-none">
              <span className="font-medium text-slate-200 group-open:text-indigo-300">
                {item.question}
              </span>
              <span className="ml-4 text-[10px] font-mono text-slate-500 group-open:text-indigo-300">
                {/** simple + / – indicator for clickability */}
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">–</span>
              </span>
            </summary>
            <div className="px-4 pb-4 pt-1 text-slate-400 leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};

export default DocsInlineFAQ;

