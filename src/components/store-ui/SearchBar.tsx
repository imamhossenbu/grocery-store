import { ArrowRight, Search } from 'lucide-react';
const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/**
 * Large pill search box that submits a plain GET to /search — works without
 * JavaScript and in server components. Used by the hero, /search and 404.
 */
export function SearchBar({
  id,
  defaultValue,
  placeholder = 'Search mango, hilsha, doi…',
  label = 'Search groceries',
  size = 'lg',
  className,
}: {
  id: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const lg = size === 'lg';
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className={cx(
        'group flex w-full items-center gap-2 rounded-full border border-[#cfe0d6] bg-white p-1.5 shadow-card transition-[border-color,box-shadow] duration-150',
        'hover:border-[#a9cdb7] focus-within:border-[#1a663b] focus-within:ring-4 focus-within:ring-[#1a663b]/12',
        lg ? 'pl-5' : 'pl-4',
        className
      )}
    >
      <Search className="h-5 w-5 shrink-0 text-[#3f5649] transition-colors group-focus-within:text-[#1a663b]" aria-hidden />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        key={defaultValue}
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        defaultValue={defaultValue}
        required
        maxLength={100}
        placeholder={placeholder}
        className={cx(
          'min-w-0 flex-1 bg-transparent py-2 text-[#112a1d] outline-none placeholder:text-[#6b8276]',
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
          lg ? 'text-base' : 'text-[15px]'
        )}
      />
      <button
        type="submit"
        className={cx(
          'fb-press inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-gradient font-bold text-white shadow-glow hover:brightness-105 cursor-pointer',
          lg ? 'h-11 px-5 text-sm sm:px-7' : 'h-10 px-5 text-sm'
        )}
      >
        Search <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden />
      </button>
    </form>
  );
}
