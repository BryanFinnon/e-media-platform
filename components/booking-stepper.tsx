"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from 'next/link';
import { ratesFor, fromPrice } from '@/lib/domain/quotes';
import { formatMoney } from '@/lib/domain/pricing';
import { services } from "@/lib/content";
import {
  bookingRequestSchema,
  bookingRequestValidationMessage,
} from "@/lib/domain/booking-request";
import {
  BOOKING_DURATION_MINUTES,
  BOOKING_START_TIMES,
  formatBookingDuration,
} from "@/lib/domain/booking-schedule";

const steps = ["Service", "Schedule", "Details", "Review"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BookingStepper({identity}:{identity:{email:string;fullName:string|null}|null}) {
  const searchParams = useSearchParams();
  const requestedService = searchParams?.get("service") ?? "";
  const initialService = services.some((service) => service.slug === requestedService)
    ? requestedService
    : "";
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [serviceSlug, setServiceSlug] = useState(initialService);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [rateId,setRateId]=useState('');
  const [quantity,setQuantity]=useState(1);
  const [details, setDetails] = useState({ name: identity?.fullName ?? '', email: identity?.email ?? '', brief: '' });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [reference, setReference] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const selected = useMemo(
    () => services.find((item) => item.slug === serviceSlug),
    [serviceSlug],
  );
  const detailsAreValid = details.name.trim().length >= 2
    && emailPattern.test(details.email)
    && details.brief.trim().length >= 20;
  const canContinue = step === 0
    ? Boolean(selected)
    : step === 1
      ? Boolean(date && time && durationMinutes)
      : step === 2
        ? detailsAreValid
        : true;

  const submit = async () => {
    const candidate = {
      serviceSlug,
      rateId: rateId || undefined,
      quantity,
      date,
      time,
      durationMinutes: Number(durationMinutes),
      ...details,
      timezone: "Europe/London" as const,
    };
    const parsed = bookingRequestSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrorMessage(bookingRequestValidationMessage(parsed.error));
      setState("error");
      setStep(2);
      return;
    }

    setState("sending");
    setErrorMessage("");
    try {
      const response = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json().catch(() => null)) as {
        reference?: string;
        error?: string;
      } | null;

      if (response.ok) {
        setReference(payload?.reference ?? "");
        setState("sent");
        return;
      }

      setErrorMessage(
        payload?.error ?? "We could not save the request. Please wait a moment and try again.",
      );
      setState("error");
    } catch {
      setErrorMessage(
        "We could not reach the booking service. Please check your connection and try again.",
      );
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="empty-state success">
        <p className="eyebrow">Request received</p>
        <h2>We have your project request.</h2>
        <p>E-MEDIA will review the details and contact you to confirm the next step. Your booking is confirmed only after the quote is approved and your 50% deposit is received.</p>
        {reference && <p className="notice">Your reference: <strong>{reference}</strong></p>}<Link href="/account" className="button">Track your project →</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="booking-progress" aria-label="Booking progress">
        {steps.map((label, index) => (
          <span className={index === step ? "active" : ""} key={label}>
            {index + 1}. {label}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div>
          <h2 className="project-title">Choose a service</h2>
          <p className="notice">Guide prices for the stated scope. We review availability and issue an itemised quote before any deposit is due.</p>
          <div className="choice-grid">
            {services.map((service) => (
              <button
                type="button"
                className="choice"
                aria-pressed={serviceSlug === service.slug}
                onClick={() => {setServiceSlug(service.slug);setRateId('');setQuantity(1);}}
                key={service.slug}
              >
                <strong>{service.name}</strong>
                <small>{service.summary}</small><strong>{fromPrice(service.slug)}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="project-title">Preferred schedule</h2>
          <div className="field"><label htmlFor="package">Preferred package</label><select id="package" className="input" value={rateId} onChange={e=>{setRateId(e.target.value);setQuantity(ratesFor(serviceSlug).find(r=>r.id===e.target.value)?.minimumQuantity??1);}}><option value="">Help me choose / custom brief</option>{ratesFor(serviceSlug).map(r=><option key={r.id} value={r.id}>{r.name} — {r.amountMinor===null?'Custom quote':formatMoney(r.amountMinor)}{r.unit==='image'?' per image':r.unit==='month'?' per month':''}</option>)}</select></div>
          {rateId&&<><p className="notice">{ratesFor(serviceSlug).find(r=>r.id===rateId)?.scope}</p><div className="field"><label htmlFor="quantity">Quantity (packages, images or months)</label><input id="quantity" className="input" type="number" min={ratesFor(serviceSlug).find(r=>r.id===rateId)?.minimumQuantity??1} max={10000} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></div></>}
          <p className="notice">Choose your preferred date, start time and duration. E-MEDIA will confirm availability before the booking is final.</p>
          <div className="form-grid schedule-grid">
            <div className="field">
              <label htmlFor="date">Preferred date</label>
              <input className="input" id="date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="time">Start time</label>
              <select className="input" id="time" required value={time} onChange={(event) => setTime(event.target.value)}>
                <option value="">Select a time</option>
                {BOOKING_START_TIMES.map((value) => <option value={value} key={value}>{value}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="duration">Duration</label>
              <select className="input" id="duration" required value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)}>
                <option value="">Select a duration</option>
                {BOOKING_DURATION_MINUTES.map((value) => <option value={value} key={value}>{formatBookingDuration(value)}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="project-title">Project details</h2>
          <div className="form-grid" style={{ marginTop: "2rem" }}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input className="input" id="name" autoComplete="name" minLength={2} required value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input className="input" id="email" type="email" autoComplete="email" required value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} />
            </div>
            <div className="field field-full">
              <label htmlFor="brief">Tell us about the project</label>
              <textarea className="input" id="brief" minLength={20} maxLength={5000} required aria-describedby="brief-help" value={details.brief} onChange={(event) => setDetails({ ...details, brief: event.target.value })} />
              <small id="brief-help" className="field-help">Minimum 20 characters. {details.brief.trim().length}/5000</small>
            </div>
          </div>
          {state === "error" && errorMessage && <p className="error-text" role="alert">{errorMessage}</p>}
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="project-title">Review request</h2>
          <div className="process">
            <div className="capability-row"><span className="section-number">01</span><strong>Service</strong><span className="capability-copy">{selected?.name}</span></div>
            <div className="capability-row"><span className="section-number">02</span><strong>Preferred schedule</strong><span className="capability-copy">{date} at {time} · {formatBookingDuration(Number(durationMinutes))} · Europe/London</span></div>
            <div className="capability-row"><span className="section-number">03</span><strong>Contact</strong><span className="capability-copy">{details.name} · {details.email}</span></div>
          </div>
          <p className="notice">E-MEDIA will approve availability and issue your quote. Pay 50% to confirm the booking; pay the final 50% after gallery preview to unlock original downloads.</p>
          {state === "error" && errorMessage && <p className="error-text" role="alert">{errorMessage}</p>}
        </div>
      )}

      {!identity&&<p className="notice">Create or access your client account before sending your request. <Link href="/auth/signup?return_to=/book">Sign in / register →</Link></p>}
      <div className="booking-actions">
        <button className="button" type="button" disabled={step === 0 || state === "sending"} onClick={() => setStep((value) => value - 1)}>← Back</button>
        {step < 3 ? (
          <button className="button button-primary" type="button" disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>Continue →</button>
        ) : (
          <button className="button button-primary" type="button" disabled={state === "sending" || !identity} onClick={submit}>{state === "sending" ? "Sending…" : "Send request →"}</button>
        )}
      </div>
    </div>
  );
}
