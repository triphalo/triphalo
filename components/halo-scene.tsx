"use client";

import { useEffect, useRef, useState } from "react";
import type { HaloController } from "./halo-engine";

type SceneStatus = "loading" | "ready" | "paused" | "static" | "unavailable";

/** The artwork is an enhancement. All content lives in the server-rendered page. */
export default function HaloScene() {
  const wrapper = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const controller = useRef<HaloController | null>(null);
  const [status, setStatus] = useState<SceneStatus>("loading");

  useEffect(() => {
    const element = mount.current;
    if (!element) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let generation = 0;

    async function initialise() {
      const currentGeneration = ++generation;
      controller.current?.dispose();
      controller.current = null;
      element!.replaceChildren();

      if (preference.matches) {
        setStatus("static");
        return;
      }

      setStatus("loading");
      try {
        const { createHalo } = await import("./halo-engine");
        if (disposed || currentGeneration !== generation) return;
        controller.current = createHalo(element!, {
          ready: () => { if (!disposed) setStatus("ready"); },
          failed: () => { if (!disposed) setStatus("unavailable"); },
          frame: (count) => {
            if (wrapper.current) wrapper.current.dataset.sceneFrames = String(count);
          },
        });
      } catch {
        if (!disposed && currentGeneration === generation) setStatus("unavailable");
      }
    }

    void initialise();
    preference.addEventListener("change", initialise);
    return () => {
      disposed = true;
      generation += 1;
      preference.removeEventListener("change", initialise);
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  const live = status === "ready" || status === "paused";

  function toggleMotion() {
    if (!controller.current) return;
    const paused = status === "ready";
    controller.current.setPaused(paused);
    setStatus(paused ? "paused" : "ready");
  }

  return (
    <div ref={wrapper} className="halo-scene" data-scene-status={status}>
      <div className="halo-scene__artwork" aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        {/* A locally rendered view of this same instrument also serves reduced motion and WebGL failure. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="halo-scene__poster"
          src="/halo-poster.webp"
          srcSet="/halo-poster-mobile.webp 700w, /halo-poster.webp 1400w"
          sizes="(max-width: 680px) 100vw, 60vw"
          alt=""
          width="1400"
          height="1400"
          fetchPriority="high"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: live ? 0 : 1 }}
        />
        <div ref={mount} className="halo-scene__canvas" style={{ position: "absolute", inset: 0, opacity: live ? 1 : 0 }} />
      </div>
      {live && (
        <button className="motion-toggle" type="button" onClick={toggleMotion} aria-pressed={status === "paused"} aria-label={status === "paused" ? "Resume artwork motion" : "Pause artwork motion"}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            {status === "paused" ? <path d="M3 1.5 10 6 3 10.5Z" /> : <><path d="M2 1h2v10H2Z" /><path d="M8 1h2v10H8Z" /></>}
          </svg>
          <span>{status === "paused" ? "Resume artwork motion" : "Pause artwork motion"}</span>
        </button>
      )}
    </div>
  );
}
