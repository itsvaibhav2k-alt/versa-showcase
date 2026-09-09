import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/src/services/search.service';
import { useAuth } from '@/src/hooks/use-auth';

export function useSearch(query: string) {
  const { orgId } = useAuth();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const result = await searchService.search(orgId!, debouncedQuery);
      if (!result.isOk) throw new Error(result.error);
      return result.value;
    },
    enabled: !!orgId && debouncedQuery.length >= 2,
  });
}
