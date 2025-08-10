/// <reference types="vite/client" />

// Support importing PNG files.
declare module '*.png' {
  const src: string;
  export default src;
}

// Support importing SVG both as a URL and as a React component when using @svgr/rollup.
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  const src: string;
  export default src;
}

// Silence TS complaint for the rollup plugin (no types published).
declare module '@svgr/rollup';
