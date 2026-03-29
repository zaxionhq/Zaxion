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
    <section className="mt-12 border-t border-border pt-8 space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((item, index) => (
          <details
            key={index}
            className="group rounded-md border border-border bg-card/50 text-xs text-muted-foreground transition-colors duration-300"
          >
            <summary className="flex items-center justify-between cursor-pointer px-4 py-2 select-none">
              <span className="font-medium text-foreground/80 group-open:text-primary">
                {item.question}
              </span>
              <span className="ml-4 text-[10px] font-mono text-muted-foreground group-open:text-primary">
                {/** simple + / – indicator for clickability */}
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">–</span>
              </span>
            </summary>
            <div className="px-4 pb-4 pt-1 text-muted-foreground/80 leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};

export default DocsInlineFAQ;

