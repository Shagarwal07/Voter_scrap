"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import "./about.css";

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
          }
        });
      },
      { threshold: 0.35 }
    );

    const idcard = containerRef.current?.querySelector("#idcard");
    const seal = containerRef.current?.querySelector("#seal");

    if (idcard) obs.observe(idcard);
    if (seal) obs.observe(seal);

    return () => obs.disconnect();
  }, []);

  return (
    <div className="iws-container" ref={containerRef}>
      <div className="iws-wrap">
        <div style={{ padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed var(--line)", marginBottom: "20px", fontFamily: "'Courier Prime', monospace", fontSize: "13px" }}>
          <button 
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--navy)", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            ← RETURN TO SEARCH / मुख्य पृष्ठ
          </button>
          <Link href="/" style={{ color: "var(--stamp)", fontWeight: "bold", textDecoration: "underline" }}>
            SEARCH HOME
          </Link>
        </div>

        <header className="letterhead">
          <div className="row">
            <div className="brandmark">
              <div className="crest">IWS</div>
              <div className="name">
                Imposter World Services
                <small>DEPT. OF SOFTWARE &amp; RELATED MATTERS</small>
              </div>
            </div>
            <div className="filecode">
              FILE NO. IWS/2026/001<br />
              JAIPUR, RAJASTHAN
            </div>
          </div>
        </header>

        <section className="hero">
          <div className="eyebrow">Notification</div>
          <h1>
            This is to certify that no such department exists — <em>only one person, building things that do.</em>
          </h1>
          <p className="lede">
            Imposter World Services is the name Shubham Agrawal ships work under. There&apos;s no office, no headcount, and no committee — just one engineer, two products currently in production, and a habit of finishing what he starts.
          </p>

          <dl className="facts">
            <div>
              <dt>Founded by</dt>
              <dd>Shubham Agrawal</dd>
            </div>
            <div>
              <dt>Staff strength</dt>
              <dd>1 (one)</dd>
            </div>
            <div>
              <dt>Products live</dt>
              <dd>2 (two)</dd>
            </div>
          </dl>
        </section>

        <div className="annexure-head">
          <span className="tag">Annexure A</span>
          <h2>Particulars of the Proprietor</h2>
        </div>
        <p className="section-note">
          Filed in accordance with the sole founder&apos;s habit of building instead of waiting.
        </p>

        <section className="founder">
          <div className="idcard" id="idcard">
            <div className="strip">
              <span>IWS · ID CARD</span>
              <span>0001</span>
            </div>
            <div className="body">
              <div className="photo relative overflow-hidden group">
                <Image 
                  src="/profile.jpg" 
                  alt="Shubham Agrawal" 
                  fill 
                  className="object-cover transition-all duration-500"
                />
              </div>
              <div className="field">
                <label>Name</label>
                <div className="val">Shubham Agrawal</div>
              </div>
              <div className="field">
                <label>Designation</label>
                <div className="val small">Founder, Sole Proprietor &amp; Only Employee</div>
              </div>
              <div className="field">
                <label>Education</label>
                <div className="val small">
                  Jaipur Engineering College and Research Centre (JECRC), Jaipur, Rajasthan
                </div>
              </div>
              <div className="barcode"></div>
              <div className="verify">
                Verifying authority:<br />
                <a
                  href="https://www.linkedin.com/in/shubham-agrawal-856601244"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  linkedin.com/in/shubham-agrawal-856601244 ↗
                </a>
              </div>
            </div>
          </div>

          <div className="founder-copy">
            <p>
              IWS isn&apos;t a registered company in any legal sense that matters here — it&apos;s the letterhead Shubham puts on his own work so it reads like an organisation instead of a side project. Everything filed under this name is designed, built, deployed, and kept running by him directly, with no team standing between the idea and the shipped product.
            </p>
            <p>
              He studied at Jaipur Engineering College and Research Centre (JECRC) in Jaipur, and has kept building past graduation — trading coursework for two products that real people currently use. The &quot;imposter&quot; in the name is the joke and the point: the work gets judged on whether it runs, not on whether the org chart looks convincing.
            </p>
          </div>
        </section>

        <div className="seal-block">
          <svg className="seal" id="seal" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="rough">
                <feTurbulence type="fractalNoise" baseFrequency="0.02 0.04" numOctaves="2" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
              </filter>
              <path id="ringtop" d="M 30,100 A 70,70 0 0 1 170,100" />
              <path id="ringbot" d="M 170,100 A 70,70 0 0 1 30,100" />
            </defs>
            <g filter="url(#rough)" fill="none" stroke="#A2382B" strokeWidth="2.5">
              <circle cx="100" cy="100" r="92" />
              <circle cx="100" cy="100" r="80" />
            </g>
            <g filter="url(#rough)" fill="#A2382B" fontFamily="Courier Prime, monospace" fontSize="12.5" letterSpacing="2.5">
              <text>
                <textPath href="#ringtop" startOffset="50%" textAnchor="middle">
                  IMPOSTER WORLD SERVICES
                </textPath>
              </text>
              <text>
                <textPath href="#ringbot" startOffset="50%" textAnchor="middle">
                  CERTIFIED · GENUINE ARTICLE
                </textPath>
              </text>
            </g>
            <g filter="url(#rough)" fill="#A2382B" textAnchor="middle" fontFamily="Fraunces, serif">
              <text x="100" y="95" fontSize="17" fontWeight="600">NOT AN</text>
              <text x="100" y="118" fontSize="17" fontWeight="600">IMPOSTER</text>
            </g>
            <g filter="url(#rough)" stroke="#A2382B" strokeWidth="1.5">
              <line x1="60" y1="130" x2="140" y2="130" />
            </g>
          </svg>
        </div>

        <div className="annexure-head">
          <span className="tag">Annexure B</span>
          <h2>Active Case Files — 2 Live</h2>
        </div>
        <p className="section-note">Both filed as production systems, not prototypes. Both currently in service.</p>

        <section className="cases">
          <article className="case">
            <div className="top">
              <div>
                <div className="idline">CASE FILE / 001 / PUBLIC DATA TOOL</div>
                <h3>
                  Electoral Roll Explorer<br />Advanced Voter Search
                </h3>
              </div>
              <span className="live-stamp">LIVE</span>
            </div>
            <p>
              A search tool built to make electoral roll data easier to navigate — letting people look up and browse voter records directly, instead of fighting a slow, form-heavy government portal to find the same information.
            </p>
            <div className="meta">
              <div>
                <strong>Category</strong>Civic / public records
              </div>
              <div>
                <strong>Built &amp; run by</strong>Shubham Agrawal
              </div>
              <div>
                <strong>Status</strong>In production
              </div>
            </div>
            <a className="case-link" href="https://34-61-251-113.nip.io/" target="_blank" rel="noopener noreferrer">
              View live deployment ↗
            </a>
          </article>

          <article className="case">
            <div className="top">
              <div>
                <div className="idline">CASE FILE / 002 / EDTECH PLATFORM</div>
                <h3>
                  LearnStudio 2.0<br />Production Learning Platform
                </h3>
              </div>
              <span className="live-stamp">LIVE</span>
            </div>
            <p>
              A ground-up rebuild of an existing learning platform, taken from working prototype to a production system — course delivery, content structure, and the everyday plumbing that keeps an ed-tech product reliable for the people using it.
            </p>
            <div className="meta">
              <div>
                <strong>Category</strong>Education technology
              </div>
              <div>
                <strong>Built &amp; run by</strong>Shubham Agrawal
              </div>
              <div>
                <strong>Status</strong>In production
              </div>
            </div>
            <a className="case-link" href="https://learn-studio-2-0.vercel.app/" target="_blank" rel="noopener noreferrer">
              View live deployment ↗
            </a>
          </article>
        </section>

        <footer>
          <div style={{ marginBottom: "16px" }}>
            <button 
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = "/";
                }
              }}
              style={{ background: "var(--navy)", color: "var(--paper)", border: "none", padding: "8px 18px", cursor: "pointer", fontFamily: "'Courier Prime', monospace", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}
            >
              ← Return to Main Screen
            </button>
          </div>
          <div className="fine">
            <strong>Imposter World Services</strong> — filed by Shubham Agrawal.<br />
            No board, no shareholders, no objections raised.
          </div>
          <div className="fine">
            Verifying authority:{" "}
            <a href="https://www.linkedin.com/in/shubham-agrawal-856601244" target="_blank" rel="noopener noreferrer">
              LinkedIn ↗
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
