import { useCallback, useEffect, useRef, useState } from 'react';

export type ApiEvent = {
  id: string;
  slug: string;
  date: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  youtubeUrl: string;
  published: boolean;
  images: string[];
};

export type ApiSermon = {
  id: string;
  date: string;
  title: string;
  speaker: string;
  youtubeUrl: string;
  mediaUrl: string;
  mediaContentType: string;
};

export type ApiResource = {
  id: string;
  title: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  category: string;
  visibility: string;
  resourceDate: string | null;
  downloadUrl: string;
};

const asArray = (payload: unknown, key: string): unknown[] => {
  const value = (payload as Record<string, unknown> | null)?.[key];
  return Array.isArray(value) ? value : [];
};

export const parseEvents = (payload: unknown): ApiEvent[] =>
  asArray(payload, 'events').map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id ?? ''),
      slug: String(row.slug ?? ''),
      date: String(row.date ?? ''),
      title: String(row.title ?? ''),
      description: String(row.description ?? ''),
      youtubeUrl: String(row.youtubeUrl ?? ''),
      location: String(row.location ?? ''),
      startTime: String(row.startTime ?? ''),
      published: row.published !== false && row.published !== 0 && row.published !== 'false',
      images: Array.isArray(row.images) ? row.images.map(String) : [],
    };
  });

export const parseSermons = (payload: unknown): ApiSermon[] =>
  asArray(payload, 'sermons').map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id ?? ''),
      date: String(row.date ?? ''),
      title: String(row.title ?? ''),
      speaker: String(row.speaker ?? ''),
      youtubeUrl: String(row.youtubeUrl ?? ''),
      mediaUrl: String(row.mediaUrl ?? ''),
      mediaContentType: String(row.mediaContentType ?? ''),
    };
  });

export const parseResources = (payload: unknown): ApiResource[] =>
  asArray(payload, 'resources')
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id ?? ''),
        title: String(row.title ?? ''),
        fileName: String(row.fileName ?? ''),
        contentType: String(row.contentType ?? ''),
        sizeBytes: Number(row.sizeBytes ?? 0),
        category: String(row.category ?? 'bulletin'),
        visibility: String(row.visibility ?? 'member'),
        resourceDate: row.resourceDate ? String(row.resourceDate) : null,
        downloadUrl: String(row.downloadUrl ?? ''),
      };
    })
    .filter((resource) => resource.downloadUrl.startsWith('/api/files/download/'));

const getJson = async (url: string): Promise<unknown> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
};

export const contentUrl = (path: string, lookup?: { id?: string; slug?: string }) => {
  const params = new URLSearchParams();
  if (lookup?.id) params.set('id', lookup.id);
  else if (lookup?.slug) params.set('slug', lookup.slug);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

export const fetchEvents = async (lookup?: { id?: string; slug?: string }): Promise<ApiEvent[]> =>
  parseEvents(await getJson(contentUrl('/api/events', lookup)));
export const fetchSermons = async (id?: string): Promise<ApiSermon[]> =>
  parseSermons(await getJson(contentUrl('/api/sermons', id ? { id } : undefined)));
export const fetchResources = async (id?: string): Promise<ApiResource[]> =>
  parseResources(await getJson(contentUrl('/api/resources', id ? { id } : undefined)));

export const fetchEvent = async (lookup: { id?: string; slug?: string }): Promise<ApiEvent | null> =>
  (await fetchEvents(lookup))[0] ?? null;
export const fetchSermon = async (id: string): Promise<ApiSermon | null> =>
  (await fetchSermons(id))[0] ?? null;
export const fetchResource = async (id: string): Promise<ApiResource | null> =>
  (await fetchResources(id))[0] ?? null;

export const useContent = <T,>(loader: () => Promise<T[]>, enabled = true) => {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  // Callers pass an inline arrow, so pin the loader to keep reload stable.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    if (!enabledRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      if (isMountedRef.current) {
        setItems(result);
      }
    } catch (cause) {
      if (isMountedRef.current) {
        setError((cause as Error).message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      isMountedRef.current = false;
      setIsLoading(false);
      return;
    }
    isMountedRef.current = true;
    void reload();
    return () => {
      isMountedRef.current = false;
    };
  }, [reload, enabled]);

  return { items, isLoading, error, reload };
};

export const useLookup = <T,>(id: string | null, loader: (id: string) => Promise<T | null>) => {
  const [item, setItem] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    if (!id) {
      setItem(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setItem(await loaderRef.current(id));
    } catch {
      setItem(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let live = true;
    if (!id) {
      setItem(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void loaderRef.current(id)
      .then((value) => {
        if (live) setItem(value);
      })
      .catch(() => {
        if (live) setItem(null);
      })
      .finally(() => {
        if (live) setIsLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id]);

  return { item, isLoading, reload };
};
