"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SmileState = {
  score: number;
  smiling: boolean;
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [smile, setSmile] = useState<SmileState>({ score: 0, smiling: false });
  const [bloom, setBloom] = useState(0);

  const bloomScale = useMemo(() => 0.6 + bloom * 0.6, [bloom]);
  const bloomRotation = useMemo(() => 5 * (1 - bloom), [bloom]);
  const stemScale = useMemo(() => 0.6 + bloom * 0.4, [bloom]);
  const flowerBottom = useMemo(() => 24 + 240 * stemScale - 80, [stemScale]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let landmarker: any = null;
    let rafId: number | null = null;
    let running = true;

    const loadLandmarker = async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });
      } catch (err) {
        setCameraError("Could not load face detector. Please reload.");
        throw err;
      }
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setCameraError(
          "Camera access is required to see the sunflower bloom. Please allow the webcam."
        );
        throw err;
      }
    };

    const getSmileScore = (blendshapes: any[]) => {
      if (!blendshapes?.length) return 0;
      const scores: Record<string, number> = {};
      blendshapes[0].categories.forEach(
        (cat: { categoryName: string; score: number }) => {
          scores[cat.categoryName] = cat.score;
        }
      );
      const left = scores["mouthSmileLeft"] ?? 0;
      const right = scores["mouthSmileRight"] ?? 0;
      return (left + right) / 2;
    };

    const loop = () => {
      if (!running || !videoRef.current || !landmarker) return;
      const nowMs = performance.now();
      const result = landmarker.detectForVideo(videoRef.current, nowMs);
      const score = getSmileScore(result?.faceBlendshapes ?? []);
      const smiling = score > 0.45;
      setSmile({ score, smiling });
      setBloom((prev) => {
        const delta = smiling ? 0.03 : -0.025;
        return Math.min(1, Math.max(0, prev + delta));
      });
      rafId = requestAnimationFrame(loop);
    };

    (async () => {
      try {
        await Promise.all([loadLandmarker(), startCamera()]);
        setInitialized(true);
        rafId = requestAnimationFrame(loop);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (landmarker?.close) {
        landmarker.close();
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-200 text-[#2b1b07]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#ffd166_0,transparent_35%),radial-gradient(circle_at_80%_10%,#ffafcc_0,transparent_25%),radial-gradient(circle_at_10%_80%,#8ecae6_0,transparent_35%)] opacity-80" />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-8 px-6 pb-20 pt-16 md:flex-row md:items-start md:gap-12 md:pt-20">
        <section className="flex max-w-xl flex-col gap-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900 shadow-sm ring-1 ring-amber-100 backdrop-blur">
            Hi Nipaakshi! 🌻
          </div>
          <h1
            className="text-4xl font-semibold leading-tight text-amber-950 drop-shadow-sm sm:text-5xl"
            style={{ fontFamily: '"Times New Roman", serif' }}
          >
            The sunflower needs the power of your smile.
            You are in camera now. Smile and see the sunflower bloom.
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium shadow-sm ring-1 ring-amber-100 backdrop-blur">
              {cameraError
                ? cameraError
                : initialized
                  ? "Camera is ready — show your smile!"
                  : "Requesting camera…"}
            </div>
            <div className="rounded-2xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-300/40">
              Smile meter: {(smile.score * 100).toFixed(0)}%
            </div>
          </div>
        </section>

        <section className="relative flex flex-1 items-center justify-center">
          <div className="relative flex h-[420px] w-[320px] items-end justify-center overflow-hidden rounded-[28px] bg-white/70 p-6 shadow-2xl shadow-amber-400/30 ring-1 ring-amber-100 backdrop-blur">
            <div className="absolute inset-x-6 top-6">
              <div className="h-2 w-full rounded-full bg-amber-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 transition-all duration-200"
                  style={{ width: `${Math.max(6, bloom * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex h-full w-full items-end justify-center">
              <div className="relative flex h-full w-[120px] items-end justify-center">
                <div
                  className="absolute bottom-24 left-1/2 h-[240px] w-2 -translate-x-1/2 origin-bottom rounded-full bg-gradient-to-b from-emerald-500 to-green-700 shadow-md transition-all duration-300"
                  style={{
                    transform: `translateX(-50%) scaleY(${stemScale})`,
                  }}
                />
                <div
                  className="absolute bottom-40 left-1/2 h-14 w-16 -translate-x-1/2 -rotate-12 origin-left rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm transition-all duration-300"
                  style={{ opacity: 0.5 + bloom * 0.5 }}
                />
                <div
                  className="absolute bottom-28 left-1/2 h-14 w-16 -translate-x-1/2 rotate-8 origin-right rounded-full bg-gradient-to-l from-green-500 to-emerald-600 shadow-sm transition-all duration-300"
                  style={{ opacity: 0.5 + bloom * 0.5 }}
                />
                <div
                  className="absolute left-1/2 flex h-40 w-40 -translate-x-1/2 items-center justify-center transition-all duration-300"
                  style={{
                    bottom: `${flowerBottom}px`,
                    left: "136px",
                    top: "87px",
                    transform: `translate(-50%, -35%) scale(${bloomScale}) rotate(${bloomRotation}deg)`,
                  }}
                >
                  <div
                    className="absolute h-40 w-40 animate-[pulse_4s_ease-in-out_infinite] rounded-full bg-amber-200/60 blur-2xl"
                    style={{ left: "129px", top: "-25px" }}
                  />
                  {[...Array(12)].map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute h-20 w-10 origin-bottom rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 shadow-md"
                      style={{
                        transform: `rotate(${idx * 30}deg) translateY(-12px) scaleY(${
                          0.85 + bloom * 0.3
                        })`,
                        opacity: 0.6 + bloom * 0.4,
                      }}
                    />
                  ))}
                  <div className="absolute top-[83px] left-1/2 -translate-x-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-yellow-400 via-amber-500 to-amber-700 shadow-inner shadow-amber-900/40">
                    <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffe9a9,transparent_35%),radial-gradient(circle_at_70%_60%,#ffc14f,transparent_40%),radial-gradient(circle,#6b3b0f_0,#4a2908_65%)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-white/50" />
        </section>
      </main>

      <video
        ref={videoRef}
        className="fixed bottom-4 right-4 h-28 w-36 rounded-2xl border border-white/60 bg-black/70 object-cover shadow-lg shadow-amber-400/30 ring-2 ring-white/70 backdrop-blur"
        playsInline
        muted
        autoPlay
      />
    </div>
  );
}
