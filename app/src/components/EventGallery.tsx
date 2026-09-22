import { useEffect, useRef, useState } from 'react';
import { eventGallerySwipeDelta, stepEventGalleryIndex } from '../lib/events';

type EventGalleryProps = {
  images: string[];
  alt: string;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
};

const EventGallery = ({
  images,
  alt,
  closeLabel,
  previousLabel,
  nextLabel,
}: EventGalleryProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const length = images.length;
  const showStep = length > 1;

  useEffect(() => {
    if (openIndex === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex]);

  if (!length) return null;

  const close = () => {
    const index = openIndex;
    setOpenIndex(null);
    if (index !== null) thumbRefs.current[index]?.focus();
  };

  const step = (delta: number) => {
    setOpenIndex((current) =>
      current === null ? current : stepEventGalleryIndex(current, delta, length)
    );
  };

  const focusables = () =>
    [closeRef.current, previousRef.current, nextRef.current].filter(
      (node): node is HTMLButtonElement => Boolean(node)
    );

  return (
    <>
      <section className="event-gallery">
        {images.map((image, index) => (
          <button
            type="button"
            className="event-gallery__thumb"
            key={image}
            ref={(node) => {
              thumbRefs.current[index] = node;
            }}
            onClick={() => setOpenIndex(index)}
            aria-label={`${alt} ${index + 1} / ${length}`}
          >
            <img src={image} alt="" />
          </button>
        ))}
      </section>

      {openIndex !== null ? (
        <div
          className="event-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={close}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              step(-1);
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              step(1);
            }
            if (event.key !== 'Tab') return;
            const nodes = focusables();
            if (!nodes.length) return;
            event.preventDefault();
            const current = nodes.indexOf(document.activeElement as HTMLButtonElement);
            const offset = event.shiftKey ? -1 : 1;
            const next = (Math.max(current, 0) + offset + nodes.length) % nodes.length;
            nodes[next].focus();
          }}
        >
          <div
            className="event-lightbox__frame"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => {
              const point = event.changedTouches[0];
              touchStart.current = { x: point.clientX, y: point.clientY };
            }}
            onTouchEnd={(event) => {
              if (!touchStart.current) return;
              const point = event.changedTouches[0];
              const delta = eventGallerySwipeDelta(
                point.clientX - touchStart.current.x,
                point.clientY - touchStart.current.y
              );
              touchStart.current = null;
              if (delta) step(delta);
            }}
          >
            <button
              ref={closeRef}
              type="button"
              className="event-lightbox__close"
              onClick={close}
            >
              {closeLabel}
            </button>
            {showStep ? (
              <button
                ref={previousRef}
                type="button"
                className="event-lightbox__nav event-lightbox__nav--prev"
                onClick={() => step(-1)}
              >
                {previousLabel}
              </button>
            ) : null}
            <img
              className="event-lightbox__image"
              src={images[openIndex]}
              alt={alt}
            />
            {showStep ? (
              <button
                ref={nextRef}
                type="button"
                className="event-lightbox__nav event-lightbox__nav--next"
                onClick={() => step(1)}
              >
                {nextLabel}
              </button>
            ) : null}
            <p className="event-lightbox__counter">
              {openIndex + 1} / {length}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default EventGallery;
