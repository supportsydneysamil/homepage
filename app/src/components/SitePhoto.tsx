import { useEffect, useState, type ReactEventHandler } from 'react';
import {
  imagePresentationStyle,
  type ImageComposition,
} from '../lib/imagePresentation';
import { nextSrcOnError } from '../lib/siteSettings';

type SitePhotoProps = {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
  presentation?: ImageComposition;
  onLoad?: ReactEventHandler<HTMLImageElement>;
};

const SitePhoto = ({
  src,
  fallback,
  alt,
  className,
  presentation,
  onLoad,
}: SitePhotoProps) => {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      style={presentation ? imagePresentationStyle(presentation) : undefined}
      onLoad={onLoad}
      onError={() => setCurrent((value) => nextSrcOnError(value, fallback))}
    />
  );
};

export default SitePhoto;
