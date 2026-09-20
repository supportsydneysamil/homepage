import { useEffect, useState } from 'react';
import { nextSrcOnError } from '../lib/siteSettings';

type SitePhotoProps = {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
};

const SitePhoto = ({ src, fallback, alt, className }: SitePhotoProps) => {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => setCurrent((value) => nextSrcOnError(value, fallback))}
    />
  );
};

export default SitePhoto;
