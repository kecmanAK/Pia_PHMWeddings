"use client";

import { useEffect, useRef, useState } from "react";
import { animate, cancelFrame, frame, type AnimationPlaybackControls } from "motion";
import { motion, useReducedMotion } from "motion/react";
import * as THREE from "three";

import type { SpherePhoto } from "@/lib/homepage";

const SPHERE_RADIUS = 5;
const IMAGE_HEIGHT = 1.9;
const BASE_CAMERA_FOV = 44;
const DESKTOP_FRAME_SCALE = 0.52;
const MOBILE_FRAME_SCALE = 0.76;
const DESKTOP_PHOTO_SCALE = 1.05;
const MOBILE_PHOTO_SCALE = 1.25;
const MAX_PHOTO_BASE_SCALE = 0.985;
const MAX_RENDER_PIXELS = 8_000_000;
const FOCUS_HOLD_DURATION = 2000;
const FOCUS_TURN_DURATION = 1800;

type SphereSession = {
  resume: (reducedMotion: boolean) => void;
  suspend: () => void;
};

// Activity hides cached pages and reconnects their effects on return. Keep GPU
// resources with the retained DOM; dispose them only when that DOM is removed.
const sphereSessions = new WeakMap<HTMLDivElement, SphereSession>();

function fibonacciSphere(count: number, radius: number) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  return Array.from({ length: count }, (_, index) => {
    const y = 1 - ((index + 0.5) / count) * 2;
    const horizontalRadius = Math.sqrt(1 - y * y);
    const angle = goldenAngle * index;

    return new THREE.Vector3(
      Math.cos(angle) * horizontalRadius,
      y,
      Math.sin(angle) * horizontalRadius,
    ).multiplyScalar(radius);
  });
}

function criticallyDampedSpring(progress: number) {
  const damping = 8;
  const response = 1 - (1 + damping * progress) * Math.exp(-damping * progress);
  const settledResponse = 1 - (1 + damping) * Math.exp(-damping);

  return response / settledResponse;
}

function getSphereContentHeight(
  baseHeight: number,
  cameraDistance: number,
  photoScale: number,
  verticalHalfFov: number,
) {
  const photoHalfHeight =
    (IMAGE_HEIGHT * MAX_PHOTO_BASE_SCALE * photoScale) / 2;
  let maximumProjection = 0;

  for (let step = 0; step < 720; step += 1) {
    const angle = (step / 720) * Math.PI * 2;
    const centerY = Math.sin(angle) * SPHERE_RADIUS;
    const centerZ = Math.cos(angle) * SPHERE_RADIUS;
    const depth = cameraDistance - centerZ;
    const projection = (centerY + photoHalfHeight) / depth;

    maximumProjection = Math.max(maximumProjection, projection);
  }

  const projectedPhotoBottom =
    (maximumProjection * baseHeight) / (2 * Math.tan(verticalHalfFov));
  const safetySpace = Math.max(32, baseHeight * 0.04);

  return Math.ceil(baseHeight / 2 + projectedPhotoBottom + safetySpace);
}

export function RotatingGallery({ photos }: { photos: SpherePhoto[] }) {
  const reducedMotion = useReducedMotion() ?? false;
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  // Restore setIsPaused here when uncommenting the Start/Stop button below.
  const [isPaused] = useState(false);
  const [renderState, setRenderState] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    // Development-only comparison: reload /?sphere=off to isolate WebGL cost.
    if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("sphere") === "off") return;
    const retainedSession = sphereSessions.get(mount);
    if (retainedSession) {
      retainedSession.resume(reducedMotion);
      return retainedSession.suspend;
    }

    let disposed = false;
    let active = true;
    let inViewport = false;
    let rendering = false;
    let prefersReducedMotion = reducedMotion;
    let needsRender = true;
    let lastWidth = 0;
    let lastHeight = 0;
    let lastPixelRatio = 0;
    let turnAnimation: AnimationPlaybackControls | undefined;
    let drag: { x: number; y: number; pointerId?: number } | null = null;
    let focusedIndex = -1;
    let holdUntil = Number.POSITIVE_INFINITY;
    let isTransitioning = false;
    let pausedAt: number | null = null;
    let galleryReady = false;
    let responsivePhotoScale = 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(BASE_CAMERA_FOV, 1, 0.1, 100);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      const showFallback = () => setRenderState("failed");
      frame.update(showFallback);
      return () => cancelFrame(showFallback);
    }
    const sphereGroup = new THREE.Group();
    const meshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
    const textures = new Set<THREE.Texture>();
    const isMobile = window.matchMedia("(pointer: coarse), (max-width: 640px)").matches;
    const positions = fibonacciSphere(photos.length, SPHERE_RADIUS);
    const focusDirections = positions.map((position) => position.clone().normalize());
    const resizeObserver = new ResizeObserver(resizeScene);
    const groupQuaternion = new THREE.Quaternion();
    const billboardQuaternion = new THREE.Quaternion();
    const transitionFromQuaternion = new THREE.Quaternion();
    const transitionToQuaternion = new THREE.Quaternion();
    const dragYawQuaternion = new THREE.Quaternion();
    const dragPitchQuaternion = new THREE.Quaternion();
    const cameraDirection = new THREE.Vector3(0, 0, 1);
    const horizontalAxis = new THREE.Vector3(0, 1, 0);
    const verticalAxis = new THREE.Vector3(1, 0, 0);
    const hero = mount.closest<HTMLElement>(".hero");

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.replaceChildren(renderer.domElement);
    scene.add(sphereGroup);

    function resizeScene() {
      const width = mount?.clientWidth ?? 0;
      const viewport = mount?.parentElement;
      const hero = viewport?.closest<HTMLElement>(".hero") ?? null;
      const baseHeight = viewport?.clientHeight ?? 0;
      if (!width || !baseHeight) return;

      const baseAspect = width / baseHeight;
      const verticalHalfFov = THREE.MathUtils.degToRad(BASE_CAMERA_FOV / 2);
      const fittedRadius = SPHERE_RADIUS + IMAGE_HEIGHT * 0.95;
      const fittedDistance = fittedRadius / Math.sin(verticalHalfFov);
      const mobileInfluence = THREE.MathUtils.clamp(
        (0.9 - baseAspect) / 0.45,
        0,
        1,
      );
      const frameScale = THREE.MathUtils.lerp(
        DESKTOP_FRAME_SCALE,
        MOBILE_FRAME_SCALE,
        mobileInfluence,
      );
      responsivePhotoScale = THREE.MathUtils.lerp(
        isMobile ? 1 : DESKTOP_PHOTO_SCALE,
        MOBILE_PHOTO_SCALE,
        mobileInfluence,
      );
      const cameraDistance = fittedDistance * frameScale;
      const contentHeight = getSphereContentHeight(
        baseHeight,
        cameraDistance,
        responsivePhotoScale,
        verticalHalfFov,
      );

      const contentHeightValue = `${contentHeight}px`;
      if (
        hero?.style.getPropertyValue("--sphere-content-height") !==
        contentHeightValue
      ) {
        hero?.style.setProperty("--sphere-content-height", contentHeightValue);
      }

      const height = mount?.clientHeight ?? baseHeight;
      const extendedHalfFov = Math.atan(
        (height / baseHeight) * Math.tan(verticalHalfFov),
      );
      const pixelRatio = Math.min(
        window.devicePixelRatio,
        2,
        Math.sqrt(MAX_RENDER_PIXELS / (width * height)),
      );

      meshes.forEach((mesh) => {
        const baseScale = mesh.userData.baseScale as number;
        mesh.scale.setScalar(baseScale * responsivePhotoScale);
      });

      camera.aspect = width / height;
      camera.fov = THREE.MathUtils.radToDeg(extendedHalfFov * 2);
      camera.position.set(0, 0, cameraDistance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      if (width !== lastWidth || height !== lastHeight || pixelRatio !== lastPixelRatio) {
        renderer.setDrawingBufferSize(width, height, pixelRatio);
        lastWidth = width;
        lastHeight = height;
        lastPixelRatio = pixelRatio;
        needsRender = true;
      }
    }

    function beginDrag(x: number, y: number, pointerId?: number) {
      turnAnimation?.stop();
      isTransitioning = false;
      drag = { x, y, pointerId };
      mount?.classList.add("is-dragging");
    }

    function moveDrag(x: number, y: number) {
      if (!drag) return;
      dragYawQuaternion.setFromAxisAngle(horizontalAxis, (x - drag.x) * 0.006);
      dragPitchQuaternion.setFromAxisAngle(verticalAxis, (y - drag.y) * 0.004);
      sphereGroup.quaternion
        .premultiply(dragYawQuaternion)
        .premultiply(dragPitchQuaternion)
        .normalize();
      drag.x = x;
      drag.y = y;
      needsRender = true;
    }

    function endDrag() {
      if (drag && drag.pointerId === undefined) {
        mount?.removeEventListener("touchmove", handleTouchGesture);
      }
      drag = null;
      mount?.classList.remove("is-dragging");
      holdUntil = performance.now() + FOCUS_HOLD_DURATION;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === "touch" || drag) return;
      beginDrag(event.clientX, event.clientY, event.pointerId);
      mount?.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
      if (drag?.pointerId === event.pointerId) moveDrag(event.clientX, event.clientY);
    }

    function handlePointerUp(event: PointerEvent) {
      if (drag?.pointerId !== event.pointerId) return;
      endDrag();
      if (mount?.hasPointerCapture(event.pointerId)) {
        mount.releasePointerCapture(event.pointerId);
      }
    }

    function handleTouchGesture(event: TouchEvent) {
      if (!galleryReady || drag?.pointerId !== undefined) return;
      if (event.touches.length !== 2 || event.targetTouches.length !== 2) {
        if (drag) endDrag();
        return;
      }
      if (!drag && !event.cancelable) return;
      if (event.cancelable) event.preventDefault();

      const first = event.targetTouches[0];
      const second = event.targetTouches[1];
      const x = (first.clientX + second.clientX) / 2;
      const y = (first.clientY + second.clientY) / 2;
      if (drag) {
        moveDrag(x, y);
      } else {
        beginDrag(x, y);
        mount?.addEventListener("touchmove", handleTouchGesture, { passive: false });
      }
    }

    function handleTouchEnd() {
      if (drag && drag.pointerId === undefined) endDrag();
    }

    function startNextFocus() {
      let nextIndex = Math.floor(Math.random() * (photos.length - 1));
      if (nextIndex >= focusedIndex) nextIndex += 1;

      focusedIndex = nextIndex;
      transitionFromQuaternion.copy(sphereGroup.quaternion);
      transitionToQuaternion.setFromUnitVectors(
        focusDirections[focusedIndex],
        cameraDirection,
      );
      isTransitioning = true;
      turnAnimation = animate(0, 1, {
        duration: FOCUS_TURN_DURATION / 1000,
        ease: criticallyDampedSpring,
        onUpdate: (progress) => {
          sphereGroup.quaternion.slerpQuaternions(
            transitionFromQuaternion,
            transitionToQuaternion,
            progress,
          );
          needsRender = true;
        },
        onComplete: () => {
          sphereGroup.quaternion.copy(transitionToQuaternion);
          isTransitioning = false;
          holdUntil = performance.now() + FOCUS_HOLD_DURATION;
        },
      });
    }

    async function buildSphere() {
      try {
        const loader = new THREE.TextureLoader();
        const loadedTextures = new Map<SpherePhoto, THREE.Texture>();

        await Promise.all(
          photos.map(async (photo) => {
            const texture = await loader.loadAsync(isMobile ? photo.mobileSrc : photo.desktopSrc);
            if (disposed) {
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            loadedTextures.set(photo, texture);
            textures.add(texture);
          }),
        );

        if (disposed) {
          textures.forEach((texture) => texture.dispose());
          return;
        }

        photos.forEach((asset, index) => {
          const texture = loadedTextures.get(asset);
          if (!texture) return;

          const aspect = THREE.MathUtils.clamp(asset.aspect, 0.7, 1.65);
          const geometry = new THREE.PlaneGeometry(IMAGE_HEIGHT * aspect, IMAGE_HEIGHT);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geometry, material);
          const baseScale = 0.82 + (index % 4) * 0.055;

          mesh.position.copy(positions[index]);
          mesh.userData.baseScale = baseScale;
          mesh.scale.setScalar(baseScale * responsivePhotoScale);
          sphereGroup.add(mesh);
          meshes.push(mesh);
        });

        if (disposed) return;
        focusedIndex = Math.floor(Math.random() * photos.length);
        sphereGroup.quaternion.setFromUnitVectors(
          focusDirections[focusedIndex],
          cameraDirection,
        );
        holdUntil = performance.now() + FOCUS_HOLD_DURATION;
        galleryReady = true;
        needsRender = true;
        setRenderState("ready");
      } catch {
        if (!disposed) setRenderState("failed");
      }
    }

    function render({ timestamp: time }: { timestamp: number }) {
      if (pausedRef.current) {
        if (pausedAt === null) {
          pausedAt = time;
          turnAnimation?.pause();
        }
      } else if (pausedAt !== null) {
        const pausedDuration = time - pausedAt;
        holdUntil += pausedDuration;
        if (isTransitioning) turnAnimation?.play();
        pausedAt = null;
      }

      if (
        galleryReady &&
        !pausedRef.current &&
        !prefersReducedMotion &&
        !drag
      ) {
        if (!isTransitioning && time >= holdUntil) {
          startNextFocus();
        }
      }

      if (!galleryReady || (!needsRender && !drag)) return;
      needsRender = false;
      sphereGroup.getWorldQuaternion(groupQuaternion);
      billboardQuaternion
        .copy(groupQuaternion)
        .invert()
        .multiply(camera.quaternion);
      meshes.forEach((mesh) => mesh.quaternion.copy(billboardQuaternion));

      renderer.render(scene, camera);
    }

    function updateRendering() {
      const shouldRender = active && inViewport && !document.hidden && !disposed;
      if (shouldRender === rendering) return;
      rendering = shouldRender;
      if (shouldRender) {
        if (pausedAt !== null) {
          holdUntil += performance.now() - pausedAt;
          pausedAt = null;
        }
        if (isTransitioning && !pausedRef.current) turnAnimation?.play();
        needsRender = true;
        frame.render(render, true);
      } else {
        cancelFrame(render);
        turnAnimation?.pause();
        pausedAt ??= performance.now();
      }
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      updateRendering();
    });

    const session: SphereSession = {
      resume(nextReducedMotion) {
        active = true;
        prefersReducedMotion = nextReducedMotion;
        if (nextReducedMotion) {
          turnAnimation?.stop();
          isTransitioning = false;
          needsRender = true;
        }
        const bounds = (hero ?? mount).getBoundingClientRect();
        inViewport = bounds.bottom > 0 && bounds.top < window.innerHeight;
        resizeScene();
        updateRendering();
      },
      suspend() {
        active = false;
        if (drag) endDrag();
        updateRendering();
      },
    };

    // An Activity cleanup is a pause, not an unmount. Observe actual removal
    // so cache eviction and real unmounts still release all GPU resources.
    const removalObserver = new MutationObserver(() => {
      if (!mount.isConnected || renderer.domElement.parentElement !== mount) dispose();
    });

    function dispose() {
      if (disposed) return;
      disposed = true;
      sphereSessions.delete(mount!);
      cancelFrame(render);
      turnAnimation?.stop();
      removalObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", updateRendering);
      resizeObserver.disconnect();
      mount!.removeEventListener("pointerdown", handlePointerDown);
      mount!.removeEventListener("pointermove", handlePointerMove);
      mount!.removeEventListener("pointerup", handlePointerUp);
      mount!.removeEventListener("pointercancel", handlePointerUp);
      mount!.removeEventListener("touchstart", handleTouchGesture);
      mount!.removeEventListener("touchmove", handleTouchGesture);
      mount!.removeEventListener("touchend", handleTouchEnd);
      mount!.removeEventListener("touchcancel", handleTouchEnd);
      meshes.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    }

    sphereSessions.set(mount, session);
    removalObserver.observe(document.body, { childList: true, subtree: true });
    visibilityObserver.observe(hero ?? mount);
    document.addEventListener("visibilitychange", updateRendering);
    resizeObserver.observe(mount);
    mount.addEventListener("pointerdown", handlePointerDown);
    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerup", handlePointerUp);
    mount.addEventListener("pointercancel", handlePointerUp);
    mount.addEventListener("touchstart", handleTouchGesture, { passive: false });
    mount.addEventListener("touchend", handleTouchEnd);
    mount.addEventListener("touchcancel", handleTouchEnd);
    resizeScene();
    void buildSphere();
    session.resume(reducedMotion);

    return session.suspend;
  }, [photos, reducedMotion]);

  return (
    <section
      className={`sphere-composition is-${renderState}${isPaused ? " is-paused" : ""}`}
      aria-label="Selected PHM Weddings portfolio photographs arranged in a rotating three-dimensional sphere"
    >
      <div className="sphere-viewport">
        <motion.div
          ref={mountRef}
          className="sphere-scene"
          initial={{ opacity: 0 }}
          animate={{ opacity: renderState === "ready" ? 1 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          role="img"
          aria-label="A draggable three-dimensional sphere of wedding photographs"
        />

        {renderState === "failed" ? (
          <p className="sphere-fallback">Portfolio preview unavailable</p>
        ) : null}
      </div>

      {/* Start/Stop button: uncomment to restore the motion control.
      <div className="sphere-sticky-ui">
        <motion.button
          className="motion-toggle"
          type="button"
          aria-pressed={isPaused}
          onClick={() => setIsPaused((current) => !current)}
          initial={false}
          animate={{ "--sticky-color": "#404040", "--sticky-blend-color": "#bfbfbf" }}
          whileHover={{ "--sticky-color": "#a1a1a1", "--sticky-blend-color": "#5e5e5e" }}
          whileFocus={{ "--sticky-color": "#a1a1a1", "--sticky-blend-color": "#5e5e5e" }}
        >
          <span className="motion-toggle__icon" aria-hidden="true">
            {isPaused ? (
              <svg viewBox="0 0 16 16">
                <path d="M5 3.5 12 8l-7 4.5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16">
                <rect x="4" y="4" width="8" height="8" />
              </svg>
            )}
          </span>
          {isPaused ? "Start" : "Stop"}
        </motion.button>
      </div>
      */}

      <ul className="sr-only">
        {photos.map((asset, index) => (
          <li key={`${asset.alt}-${index}`}>{asset.alt}</li>
        ))}
      </ul>
    </section>
  );
}
