import { useEffect, useRef } from "react";

interface SearchResultsSentinelProps {
  onVisible: () => void;
}

export function SearchResultsSentinel({
  onVisible,
}: SearchResultsSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) onVisible();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisible]);

  return <div ref={ref} aria-hidden="true" style={{ height: 1 }} />;
}
