import { useEffect, useState } from 'react';
import { initialOf } from '../lib/mokjang';

type MokjangCoverProps = {
  src: string;
  name: string;
  className: string;
};

const MokjangCover = ({ src, name, className }: MokjangCoverProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`${className} mokjang-cover--default`} aria-hidden="true">
        <span>{initialOf(name)}</span>
      </div>
    );
  }

  return <img className={className} src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
};

export default MokjangCover;
