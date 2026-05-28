import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

type Labels = Record<string, string>;

interface LabelContextValue {
  labels: Labels;
  locale: string;
  loading: boolean;
  t: (key: string, fallback: string) => string;
  reload: () => void;
}

const LabelContext = createContext<LabelContextValue>({
  labels: {},
  locale: 'en',
  loading: false,
  t: (_key, fallback) => fallback,
  reload: () => {},
});

export function useLabels() {
  return useContext(LabelContext);
}

export function LabelProvider({ organizationId, branchId, locale = 'en', children }: {
  organizationId?: string;
  branchId?: string;
  locale?: string;
  children: React.ReactNode;
}) {
  const [labels, setLabels] = useState<Labels>({});
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    if (!organizationId && !branchId) {
      setLabels({});
      return;
    }
    setLoading(true);
    api.labels.get({ organizationId, branchId, locale })
      .then(d => setLabels(d.labels || {}))
      .catch(() => setLabels({}))
      .finally(() => setLoading(false));
  }, [organizationId, branchId, locale, version]);

  const value = useMemo<LabelContextValue>(() => ({
    labels,
    locale,
    loading,
    t: (key, fallback) => labels[key] || fallback,
    reload,
  }), [labels, locale, loading, reload]);

  return <LabelContext.Provider value={value}>{children}</LabelContext.Provider>;
}
