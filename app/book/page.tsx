import {redirect} from 'next/navigation';
import {getCurrentIdentity} from '@/lib/server/sites';
import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingStepper } from "@/components/booking-stepper";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "Start a project", description: "Request an E-MEDIA creative, technology or content project." };
export const dynamic="force-dynamic";
export default async function BookPage({searchParams}:{searchParams:Promise<{service?:string}>}) { const identity=await getCurrentIdentity(); if(!identity){ const service=(await searchParams).service; const returnTo=service?`/book?service=${encodeURIComponent(service)}`:'/book'; redirect(`/auth/signup?return_to=${encodeURIComponent(returnTo)}`); } return <><PageHero eyebrow="Bookings & enquiries" title={<>Start a<br />project.</>}><p>Choose the closest service and tell us what you are making. Availability and commercial terms are confirmed by E-MEDIA before a booking becomes final.</p></PageHero><section className="section"><div className="page-shell form-shell"><Suspense fallback={<div className="empty-state">Loading booking options…</div>}><BookingStepper identity={identity} /></Suspense></div></section></>; }
