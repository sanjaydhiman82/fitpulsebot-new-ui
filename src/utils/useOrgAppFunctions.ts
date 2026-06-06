import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const normalize = (value: string) => value.trim().replace(/\s+/g, '_');

export function useOrgAppFunctions(organizationId?: string) {
  const [visibleFunctions, setVisibleFunctions] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!organizationId) {
      setVisibleFunctions(null);
      return;
    }
    api.appFunctions.visibleForOrg(organizationId)
      .then((data: any) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.functions) ? data.functions : [];
        setVisibleFunctions(new Set(rows.map((row: any) => String(row.function || ''))));
      })
      .catch(() => {
        if (!cancelled) setVisibleFunctions(null);
      });
    return () => { cancelled = true; };
  }, [organizationId]);

  return useMemo(() => ({
    ready: !organizationId || visibleFunctions !== null,
    isVisible: (label: string) => !organizationId || visibleFunctions === null || visibleFunctions.has(normalize(label)),
  }), [organizationId, visibleFunctions]);
}
