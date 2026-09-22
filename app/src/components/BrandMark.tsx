import { useEffect, useState } from 'react';

type BrandMarkProps = {
  src: string;
  className?: string;
};

const BrandMark = ({ src, className = 'brand-mark' }: BrandMarkProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={showImage ? `${className} brand-mark--image` : className}
      aria-hidden="true"
    >
      {showImage ? (
        <img src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        'S'
      )}
    </span>
  );
};

export default BrandMark;
