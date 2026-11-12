import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';

/** Section wrapper with the brand heading and an optional "view all" link. */
export function HomeSection({
  eyebrow,
  title,
  subtitle,
  href,
  hrefLabel = 'View all',
  className = '',
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`py-14 sm:py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          action={
            href ? (
              <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#1a663b] hover:text-[#14522f]">
                {hrefLabel} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            ) : undefined
          }
        />
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
