"use client";

import type { ComponentType } from "react";

export type NavIcon = ComponentType<{ className?: string }>;

type IconProps = { className?: string };

function svgProps(className: string) {
  return {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
    role: "presentation",
    className: `nav-icon ${className}`.trim(),
  } as const;
}

/**
 * HOME — the dashboard as a bento of panels.
 */
export function NavHomeIcon({ className = "" }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <rect x="3" y="3" width="8.6" height="8.6" rx="2.5" opacity=".95" data-nav-motion="pop" />
      <rect
        x="13"
        y="3"
        width="8"
        height="5"
        rx="2"
        opacity=".55"
        data-nav-motion="pop"
        data-nav-delay="1"
      />
      <rect
        x="13"
        y="9.4"
        width="8"
        height="11.6"
        rx="2.3"
        opacity=".7"
        data-nav-motion="pop"
        data-nav-delay="2"
      />
      <rect
        x="3"
        y="13"
        width="8.6"
        height="8"
        rx="2.3"
        opacity=".35"
        data-nav-motion="pop"
        data-nav-delay="3"
      />
    </svg>
  );
}

/**
 * PRACTICE — a question with its answer bubbles, one of them filled.
 */
export function NavPracticeIcon({ className = "" }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <rect
        x="2.4"
        y="4"
        width="19.2"
        height="16"
        rx="3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        opacity=".45"
      />
      <rect
        x="5.6"
        y="7.4"
        width="12.8"
        height="2.3"
        rx="1.15"
        opacity=".8"
        data-nav-motion="wipe"
      />
      <circle cx="7.4" cy="15" r="2.1" opacity=".95" data-nav-motion="pop" data-nav-delay="1" />
      <circle cx="12" cy="15" r="2.1" opacity=".3" data-nav-motion="pop" data-nav-delay="2" />
      <circle cx="16.6" cy="15" r="2.1" opacity=".3" data-nav-motion="pop" data-nav-delay="3" />
    </svg>
  );
}

/**
 * VOCAB — a word card with another card behind it.
 */
export function NavVocabIcon({ className = "" }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <rect
        x="7.2"
        y="2.6"
        width="14.2"
        height="14.2"
        rx="2.8"
        opacity=".3"
        data-nav-motion="fan"
      />
      <rect
        x="2.6"
        y="7.2"
        width="14.2"
        height="14.2"
        rx="2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6.6 18 9.7 11l3.1 7M7.7 15.9h4"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-nav-motion="draw"
        data-nav-delay="1"
      />
    </svg>
  );
}

/**
 * RESULTS — a score dial, part-filled.
 */
export function NavResultsIcon({ className = "" }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path
        d="M5.9 18.7a8.6 8.6 0 1 1 12.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity=".3"
      />
      <path
        d="M5.9 18.7A8.6 8.6 0 0 1 17.6 6.4"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        data-nav-motion="draw"
      />
      <path
        d="m12 12.6 3.6-3.9"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity=".85"
        data-nav-motion="draw"
        data-nav-delay="2"
      />
    </svg>
  );
}

/**
 * ERROR LOG — an answer bubble marked wrong with a cross.
 */
export function NavErrorLogIcon({ className = "" }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <circle
        cx="12"
        cy="12"
        r="9.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity=".45"
      />
      <path
        d="m8.8 8.8 6.4 6.4"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        data-nav-motion="draw"
      />
      <path
        d="M15.2 8.8l-6.4 6.4"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        data-nav-motion="draw"
        data-nav-delay="2"
      />
    </svg>
  );
}

/**
 * STATISTICS — the hexagon radar plot.
 */
export function NavStatisticsIcon({ className = "" }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path
        d="M12 2.6 20.4 7.3v9.4L12 21.4 3.6 16.7V7.3L12 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        opacity=".4"
      />
      <path
        d="M12 4.6 17.5 8.8 18.1 15.5 12 17.2 6.3 15.3 5.3 8.1 12 4.6Z"
        opacity=".9"
        data-nav-motion="pop"
        data-nav-delay="1"
      />
    </svg>
  );
}

/**
 * ADMIN — a shield with a tick.
 */
export function NavAdminIcon({ className = "" }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path
        d="M12 2.4 4.2 5.4v6.2c0 4.6 3.3 8.6 7.8 9.9 4.5-1.3 7.8-5.3 7.8-9.9V5.4L12 2.4Z"
        opacity=".36"
        data-nav-motion="rise"
      />
      <path
        d="m8.2 12 2.9 2.9 4.8-5.2"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-nav-motion="draw"
        data-nav-delay="2"
      />
    </svg>
  );
}
