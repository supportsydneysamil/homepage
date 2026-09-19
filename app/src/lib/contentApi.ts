import { useCallback, useEffect, useRef, useState } from 'react';

export type ApiEvent = {
  id: string;
  slug: string;
  date: string;
  title: string;
  description: string;
  youtubeUrl: string;
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
  contentType: string;
  sizeBytes: number;
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
        contentType: String(row.contentType ?? ''),
        sizeBytes: Number(row.sizeBytes ?? 0),
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

export const fetchEvents = async (): Promise<ApiEvent[]> => parseEvents(await getJson('/api/events'));
export const fetchSermons = async (): Promise<ApiSermon[]> => parseSermons(await getJson('/api/sermons'));
export const fetchResources = async (): Promise<ApiResource[]> => parseResources(await getJson('/api/resources'));

export const useContent = <T,>(loader: () => Promise<T[]>) => {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  // Callers pass an inline arrow, so pin the loader to keep reload stable.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
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
    isMountedRef.current = true;
    void reload();
    return () => {
      isMountedRef.current = false;
    };
  }, [reload]);

  return { items, isLoading, error, reload };
};
