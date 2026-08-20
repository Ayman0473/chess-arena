import React from 'react';

export const PIECE_SVGS: Record<string, React.ReactNode> = {
  // White Pieces
  wK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path d="M22.5 11.63V6M20 8h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M22.5 25c-4 0-7.5 1.5-10 4 0 0 2.5 2.5 10 2.5s10-2.5 10-2.5c-2.5-2.5-6-4-10-4z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M11.5 37c5.5 3.5 16.5 3.5 22 0v-3c0 0-3-1.5-11-1.5s-11 1.5-11 1.5v3z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M12.5 30c5.5-2.5 14.5-2.5 20 0v-2c0 0-3-2.5-10-2.5s-10 2.5-10 2.5v2z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M22.5 11.5c-4.14 0-7.5 3.36-7.5 7.5 0 2.5 1.25 4.7 3.17 6.04 1.22.85 2.7 1.46 4.33 1.46s3.11-.61 4.33-1.46c1.92-1.34 3.17-3.54 3.17-6.04 0-4.14-3.36-7.5-7.5-7.5z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),
  wQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5h24s0-1.5-1.5-2.5c-.5-2.5-.5-2 0-3.5 1-2 2.5-2 2.5-4-2.5-2-4.5 0-6.5 2-1.5 1.5-2 1.5-3.5 1.5s-2 0-3.5-1.5c-2-2-4-4-6.5-2z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M9 26c0 2 1.5 2 2.5 4M36 26c0 2-1.5 2-2.5 4"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M11.5 30c3.5-1 6.5-1 11 0M11.5 33.5c3.5-1 6.5-1 11 0"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <circle cx="9" cy="16" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="15.75" cy="13" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="22.5" cy="11" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="29.25" cy="13" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="36" cy="16" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <path
        d="M9 16l3 10M15.75 13l2 13M22.5 11v15M29.25 13l-2 13M36 16l-3 10"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),
  wR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M9 39h27v-3H9v3zM12 36h21v-4H12v4zM11 14h23l-2 4H13l-2-4zM14 18h17v10H14V18zM12 28h21v4H12v-4z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M9 14l3-5h4v3h3V9h4v3h3V9h4l3 5H9z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),
  wB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="#fff" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M9 36h27v-3H9v3zM12 33h21v-3H12v3zM11 27h23l-2 3H13l-2-3z" />
        <path d="M22.5 10a7.5 7.5 0 0 0-7.5 7.5c0 2.5 1.5 5 3.5 6.5s3 3 4 3 2-1.5 4-3 3.5-4 3.5-6.5a7.5 7.5 0 0 0-7.5-7.5z" />
        <path d="M17.5 26h10" />
      </g>
      <circle cx="22.5" cy="8" r="1.5" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M20 12h5M22.5 9.5v5" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  ),
  wN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-12-1-2.5-3-1-4.5 1-1.5 2-1.5 2-3 2.5s-2.5 1.5-2 4c.5 2.5.5 2.5-1 3.5s-2.5.5-3-1.5c-.5-2 0-3 1.5-4.5s4-3.5 3-7c-1-3.5-3-5.5-3-5.5s1-1 4.5-1.5c3.5-.5 5 0 7.5 2z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <circle cx="27" cy="18" r="1.5" fill="#1e293b" />
    </svg>
  ),
  wP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 13 30.13 13 34h19c0-3.87-2.41-6.91-5.41-7.97C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),

  // Black Pieces
  bK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path d="M22.5 11.63V6M20 8h5" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M22.5 25c-4 0-7.5 1.5-10 4 0 0 2.5 2.5 10 2.5s10-2.5 10-2.5c-2.5-2.5-6-4-10-4z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M11.5 37c5.5 3.5 16.5 3.5 22 0v-3c0 0-3-1.5-11-1.5s-11 1.5-11 1.5v3z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M12.5 30c5.5-2.5 14.5-2.5 20 0v-2c0 0-3-2.5-10-2.5s-10 2.5-10 2.5v2z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M22.5 11.5c-4.14 0-7.5 3.36-7.5 7.5 0 2.5 1.25 4.7 3.17 6.04 1.22.85 2.7 1.46 4.33 1.46s3.11-.61 4.33-1.46c1.92-1.34 3.17-3.54 3.17-6.04 0-4.14-3.36-7.5-7.5-7.5z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path d="M20 8h5M22.5 6v5.5" stroke="#fbbf24" strokeWidth="1.5" />
    </svg>
  ),
  bQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5h24s0-1.5-1.5-2.5c-.5-2.5-.5-2 0-3.5 1-2 2.5-2 2.5-4-2.5-2-4.5 0-6.5 2-1.5 1.5-2 1.5-3.5 1.5s-2 0-3.5-1.5c-2-2-4-4-6.5-2z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <circle cx="9" cy="16" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="15.75" cy="13" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="22.5" cy="11" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="29.25" cy="13" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="36" cy="16" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  ),
  bR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M9 39h27v-3H9v3zM12 36h21v-4H12v4zM11 14h23l-2 4H13l-2-4zM14 18h17v10H14V18zM12 28h21v4H12v-4z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path d="M9 14l3-5h4v3h3V9h4v3h3V9h4l3 5H9z" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  ),
  bB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M9 36h27v-3H9v3zM12 33h21v-3H12v3zM11 27h23l-2 3H13l-2-3z" />
        <path d="M22.5 10a7.5 7.5 0 0 0-7.5 7.5c0 2.5 1.5 5 3.5 6.5s3 3 4 3 2-1.5 4-3 3.5-4 3.5-6.5a7.5 7.5 0 0 0-7.5-7.5z" />
      </g>
      <circle cx="22.5" cy="8" r="1.5" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  ),
  bN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-12-1-2.5-3-1-4.5 1-1.5 2-1.5 2-3 2.5s-2.5 1.5-2 4c.5 2.5.5 2.5-1 3.5s-2.5.5-3-1.5c-.5-2 0-3 1.5-4.5s4-3.5 3-7c-1-3.5-3-5.5-3-5.5s1-1 4.5-1.5c3.5-.5 5 0 7.5 2z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <circle cx="27" cy="18" r="1.5" fill="#fbbf24" />
    </svg>
  ),
  bP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 13 30.13 13 34h19c0-3.87-2.41-6.91-5.41-7.97C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),
};
