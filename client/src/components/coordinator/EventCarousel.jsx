import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline';

/**
 * Event Carousel banner matching the top-right header area in the reference wireframe:
 * Supports event image, name, date, short description, pagination dots, and prev/next controls.
 */
const EventCarousel = ({ events = [], className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto rotate every 6 seconds if multiple events
  useEffect(() => {
    if (events.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [events.length]);

  if (!events || events.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-slate-400 ${className}`}>
        <p className="text-xs">No active event spotlights.</p>
      </div>
    );
  }

  const current = events[currentIndex] || events[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  return (
    <div className={`relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}>
      {/* Slide Image & Overlay */}
      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
        <img
          src={current.banner}
          alt={current.name}
          className="h-full w-full object-cover opacity-75 transition-all duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-md bg-blue-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            {current.type || 'Event'}
          </span>
        </div>

        {/* Content over banner */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h4 className="text-sm font-bold truncate drop-shadow-xs">{current.name}</h4>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-200">
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="h-3.5 w-3.5 text-blue-400" />
              {current.startDate} • {current.startTime}
            </span>
            {current.venue && (
              <span className="flex items-center gap-1 truncate">
                <MapPinIcon className="h-3.5 w-3.5 text-blue-400" />
                {current.venue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Slide Description & Controls Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-3.5 py-2.5">
        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5">
          {events.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx ? 'w-5 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCarousel;
