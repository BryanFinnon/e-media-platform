'use client';
import {useRef} from 'react';
import type {ReactNode} from 'react';
export function ProjectCarousel({children}:{children:ReactNode}) {
 const track=useRef<HTMLDivElement>(null);
 function move(direction:number){track.current?.scrollBy({left:direction*track.current.clientWidth*0.75,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 return <div className="project-carousel"><div className="carousel-toolbar"><p className="help-text">Scroll to explore / swipe on mobile</p><div className="carousel-buttons"><button className="button" onClick={()=>move(-1)} aria-label="Previous projects">←</button><button className="button" onClick={()=>move(1)} aria-label="Next projects">→</button></div></div><div className="project-track" ref={track} role="region" aria-label="Selected project gallery" tabIndex={0}>{children}</div></div>;
}
