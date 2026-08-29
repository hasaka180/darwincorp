"use client";

import { Component, type ReactNode } from "react";

/**
 * Keeps a failing 3D scene from taking the page down with it.
 *
 * three.js throws "Error creating WebGL context" when the GPU can't give it
 * one — common on low-end phones, in Low Power Mode, in in-app browsers, and
 * under memory pressure. Without a boundary that error reaches
 * Next's root error boundary, which replaces the whole document: no hero, no
 * sections, no carousels. Here it degrades to the fallback instead.
 */
export default class SceneBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; onFail?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[hero] 3D scene disabled:", error);
    this.props.onFail?.();
  }

  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children;
  }
}
