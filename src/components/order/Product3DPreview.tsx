import { Suspense, useRef, useMemo } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { getFrameTexture } from "@/lib/frame-textures";

/** Lighten/darken a hex color by a factor (-1 to 1) — matches ProductPreview */
function adjustColor(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const adjust = (c: number) => {
    if (factor > 0) return Math.round(c + (255 - c) * factor);
    return Math.round(c * (1 + factor));
  };
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

interface Product3DPreviewProps {
  imageUrl: string;
  widthCm: number;
  heightCm: number;
  productSlug?: string;
  borders?: { top: number; bottom: number; left: number; right: number };
  frameWidthCm?: number;
  frameColorHex?: string;
  frameColorId?: string;
  edgeWrap?: string;
  subframeData?: {
    material: string;
    width_cm: number;
    height_cm: number;
    inset_cm: number;
    color: string;
  };
}

const SCALE = 0.1;

/** Helper: create a textured material for a frame piece */
function createFrameTextureMaterial(
  textureUrl: string,
  isHorizontal: boolean,
  loader: THREE.TextureLoader
): THREE.MeshBasicMaterial {
  const tex = loader.load(textureUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Use ClampToEdge (no tiling) to match 2D "cover" style
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  // Rotate texture 90° for horizontal pieces so grain follows the long side
  if (isHorizontal) {
    tex.rotation = Math.PI / 2;
    tex.center.set(0.5, 0.5);
  }
  tex.repeat.set(1, 1);
  return new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
}

function PrintMesh({
  imageUrl,
  widthCm,
  heightCm,
  productSlug,
  borders,
  frameWidthCm,
  frameColorHex,
  frameColorId,
  edgeWrap,
  subframeData,
}: Product3DPreviewProps) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  const hasBorders = borders && (borders.top > 0 || borders.bottom > 0 || borders.left > 0 || borders.right > 0);
  const totalW = widthCm + (borders?.left ?? 0) + (borders?.right ?? 0);
  const totalH = heightCm + (borders?.top ?? 0) + (borders?.bottom ?? 0);
  const frameCm = frameWidthCm ?? 0;
  const hasFrame = frameCm > 0 && !!frameColorHex;

  const w = totalW * SCALE;
  const h = totalH * SCALE;

  const isCanvas = productSlug === "canvas";
  const isPlexiglass = productSlug === "plexiglass";
  const isHdMetal = productSlug === "hd-metal";
  const wrap = edgeWrap ?? "white";

  const config = useMemo(() => {
    switch (productSlug) {
      case "hd-metal":
        // 1.14mm thickness, 3mm rounded corners on perimeter
        return { depth: 0.114 * SCALE, cornerRadius: 0.3 * SCALE, metalness: 0.45, roughness: 0.35, color: "#c8c8c8" };
      case "canvas":
        return { depth: 0.35, radius: 0.01, metalness: 0, roughness: 0.92, color: "#ece6d8" };
      case "dibond":
        return { depth: 0.06, radius: 0.005, metalness: 0.3, roughness: 0.45, color: "#c8c8c8" };
      case "plexiglass":
        // 2mm plexi top + image + 3mm dibond backing = 5mm total
        return { depth: 0.5 * SCALE, plexiDepth: 0.2 * SCALE, dibondDepth: 0.3 * SCALE, radius: 0.005, metalness: 0.05, roughness: 0.12, color: "#c8c8c8" };
      case "framed":
        return { depth: 0.1, radius: 0.005, metalness: 0.02, roughness: 0.7, color: "#fafafa" };
      case "photo-paper":
      default:
        return { depth: 0.03, radius: 0.005, metalness: 0, roughness: 0.65, color: "#fafafa" };
    }
  }, [productSlug]);

  const frameColor = useMemo(() => {
    if (!frameColorHex) return new THREE.Color("#333333");
    return new THREE.Color(frameColorHex);
  }, [frameColorHex]);

  // Load frame wood texture if available
  const frameTextureUrl = frameColorId ? getFrameTexture(frameColorId) : undefined;

  // Use MeshBasicMaterial for the print face — unlit, so colors match the original photo exactly
  const imageMaterial = useMemo(() => {
    const tex = texture.clone();
    tex.needsUpdate = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({
      map: tex,
      toneMapped: false,
    });
  }, [texture]);

  // Canvas edge textures for gallery/mirrored wrap
  const canvasEdgeData = useMemo(() => {
    if (!isCanvas) return null;

    if (wrap === "white") return { type: "white" as const };

    const depthCm = config.depth / SCALE;
    const wRatio = Math.min(depthCm / totalW, 0.5);
    const hRatio = Math.min(depthCm / totalH, 0.5);
    const mirrorCm = 3;
    const mwRatio = Math.min(mirrorCm / totalW, 0.5);
    const mhRatio = Math.min(mirrorCm / totalH, 0.5);

    const rw = wrap === "gallery" ? wRatio : mwRatio;
    const rh = wrap === "gallery" ? hRatio : mhRatio;
    const isG = wrap === "gallery";

    const makeTex = (offsetX: number, offsetY: number, repeatX: number, repeatY: number, flipX = false, flipY = false) => {
      const t = texture.clone();
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.offset.set(offsetX, offsetY);
      t.repeat.set(repeatX, repeatY);
      if (flipX) { t.repeat.x = -Math.abs(t.repeat.x); t.offset.x = offsetX + Math.abs(repeatX); }
      if (flipY) { t.repeat.y = -Math.abs(t.repeat.y); t.offset.y = offsetY + Math.abs(repeatY); }
      return t;
    };

    // Gallery: stretch edge strip of image onto side. Mirrored: flip that strip.
    // Left edge: shows left strip of image (u: 0 to rw)
    const leftTex = makeTex(0, 0, rw, 1, !isG, false);
    // Right edge: shows right strip (u: 1-rw to 1)  
    const rightTex = makeTex(1 - rw, 0, rw, 1, !isG, false);
    // Top edge: shows top strip (v: 1-rh to 1)
    const topTex = makeTex(0, 1 - rh, 1, rh, false, !isG);
    // Bottom edge: shows bottom strip (v: 0 to rh)
    const bottomTex = makeTex(0, 0, 1, rh, false, !isG);

    return {
      type: "textured" as const,
      meshData: { leftTex, rightTex, topTex, bottomTex },
    };
  }, [isCanvas, wrap, texture, config.depth, totalW, totalH]);

  // Canvas texture overlay
  // Canvas texture overlay removed — caused visible moiré artefacts

  return (
    <group ref={meshRef}>
      {/* Frame */}
      {hasFrame && (() => {
        const frameDepth = 3 * SCALE;
        const fW = frameCm * SCALE;
        const oW = (totalW + frameCm * 2) * SCALE;
        const oH = (totalH + frameCm * 2) * SCALE;
        const iW = w; // totalW * SCALE
        const iH = h; // totalH * SCALE
        const baseHex = frameColorHex || "#333333";

        // Uniform color for all frame sides (no bevel shading)
        const frameCol = new THREE.Color(baseHex);

        // Each trapezoid defined in XY at its final position, extruded along Z
        const topShape = new THREE.Shape();
        topShape.moveTo(-oW / 2, oH / 2);
        topShape.lineTo(oW / 2, oH / 2);
        topShape.lineTo(iW / 2, iH / 2);
        topShape.lineTo(-iW / 2, iH / 2);
        topShape.closePath();

        const bottomShape = new THREE.Shape();
        bottomShape.moveTo(-oW / 2, -oH / 2);
        bottomShape.lineTo(oW / 2, -oH / 2);
        bottomShape.lineTo(iW / 2, -iH / 2);
        bottomShape.lineTo(-iW / 2, -iH / 2);
        bottomShape.closePath();

        const leftShape = new THREE.Shape();
        leftShape.moveTo(-oW / 2, oH / 2);
        leftShape.lineTo(-iW / 2, iH / 2);
        leftShape.lineTo(-iW / 2, -iH / 2);
        leftShape.lineTo(-oW / 2, -oH / 2);
        leftShape.closePath();

        const rightShape = new THREE.Shape();
        rightShape.moveTo(oW / 2, oH / 2);
        rightShape.lineTo(iW / 2, iH / 2);
        rightShape.lineTo(iW / 2, -iH / 2);
        rightShape.lineTo(oW / 2, -oH / 2);
        rightShape.closePath();

        const extOpts = { depth: frameDepth, bevelEnabled: false };
        const zPos = config.depth / 2 - frameDepth;

        // Miter line geometry (4 diagonal lines from outer to inner corners)
        const miterCol = new THREE.Color(adjustColor(baseHex, -0.15));
        const miterZ = zPos + frameDepth + 0.001;
        const miterPoints = [
          [[-oW/2, oH/2], [-iW/2, iH/2]],
          [[oW/2, oH/2], [iW/2, iH/2]],
          [[-oW/2, -oH/2], [-iW/2, -iH/2]],
          [[oW/2, -oH/2], [iW/2, -iH/2]],
        ];

        // Create textured materials if texture available
        const texLoader = new THREE.TextureLoader();
        const topMat = frameTextureUrl
          ? createFrameTextureMaterial(frameTextureUrl, true, texLoader)
          : new THREE.MeshBasicMaterial({ color: frameCol, toneMapped: false });
        const bottomMat = frameTextureUrl
          ? createFrameTextureMaterial(frameTextureUrl, true, texLoader)
          : new THREE.MeshBasicMaterial({ color: frameCol, toneMapped: false });
        const leftMat = frameTextureUrl
          ? createFrameTextureMaterial(frameTextureUrl, false, texLoader)
          : new THREE.MeshBasicMaterial({ color: frameCol, toneMapped: false });
        const rightMat = frameTextureUrl
          ? createFrameTextureMaterial(frameTextureUrl, false, texLoader)
          : new THREE.MeshBasicMaterial({ color: frameCol, toneMapped: false });

        return (
          <group>
            <mesh position={[0, 0, zPos]}>
              <extrudeGeometry args={[topShape, extOpts]} />
              <primitive object={topMat} attach="material" />
            </mesh>
            <mesh position={[0, 0, zPos]}>
              <extrudeGeometry args={[bottomShape, extOpts]} />
              <primitive object={bottomMat} attach="material" />
            </mesh>
            <mesh position={[0, 0, zPos]}>
              <extrudeGeometry args={[leftShape, extOpts]} />
              <primitive object={leftMat} attach="material" />
            </mesh>
            <mesh position={[0, 0, zPos]}>
              <extrudeGeometry args={[rightShape, extOpts]} />
              <primitive object={rightMat} attach="material" />
            </mesh>
            {/* Miter joint lines on front face */}
            {miterPoints.map((pts, i) => {
              const geom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(pts[0][0], pts[0][1], miterZ),
                new THREE.Vector3(pts[1][0], pts[1][1], miterZ),
              ]);
              const mat = new THREE.LineBasicMaterial({ color: miterCol, transparent: true, opacity: 0.35, toneMapped: false });
              const lineObj = new THREE.Line(geom, mat);
              return <primitive key={`miter-${i}`} object={lineObj} />;
            })}
          </group>
        );
      })()}

      {/* Main panel body — for canvas, use a simple box so edge planes aren't hidden */}
      {isCanvas ? (
        <mesh>
          <boxGeometry args={[w - 0.002, h - 0.002, config.depth - 0.002]} />
          <meshBasicMaterial color={config.color} toneMapped={false} />
        </mesh>
      ) : isHdMetal ? (() => {
        // Custom rounded-corner rectangle extruded to 1.14mm
        const r = config.cornerRadius;
        const hw = w / 2, hh = h / 2;
        const shape = new THREE.Shape();
        shape.moveTo(-hw + r, hh);
        shape.lineTo(hw - r, hh);
        shape.quadraticCurveTo(hw, hh, hw, hh - r);
        shape.lineTo(hw, -hh + r);
        shape.quadraticCurveTo(hw, -hh, hw - r, -hh);
        shape.lineTo(-hw + r, -hh);
        shape.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
        shape.lineTo(-hw, hh - r);
        shape.quadraticCurveTo(-hw, hh, -hw + r, hh);
        return (
          <mesh position={[0, 0, -config.depth / 2]}>
            <extrudeGeometry args={[shape, { depth: config.depth, bevelEnabled: false, curveSegments: 8 }]} />
            <meshBasicMaterial color={config.color} toneMapped={false} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={2} />
          </mesh>
        );
      })() : (
        <RoundedBox args={[w, h, config.depth]} radius={config.radius} smoothness={4}>
          <meshStandardMaterial color={config.color} metalness={config.metalness} roughness={config.roughness} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={2} />
        </RoundedBox>
      )}

      {/* White border background */}
      {hasBorders && (
        <mesh position={[0, 0, config.depth / 2 + 0.005]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      )}

      {/* Image on front face — MeshBasicMaterial = true colors */}
      <mesh position={[0, 0, config.depth / 2 + 0.01]}>
        <planeGeometry
          args={
            hasBorders
              ? [(widthCm / totalW) * w, (heightCm / totalH) * h]
              : [w * 0.998, h * 0.998]
          }
        />
        <primitive object={imageMaterial} attach="material" />
      </mesh>

      {/* Canvas side edges — white */}
      {isCanvas && canvasEdgeData?.type === "white" && (
        <>
          <mesh position={[0, h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, config.depth]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
          <mesh position={[0, -h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, config.depth]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
          <mesh position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[config.depth, h]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
          <mesh position={[w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[config.depth, h]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
        </>
      )}
      {/* Canvas side edges — gallery / mirrored wrap */}
      {isCanvas && canvasEdgeData?.type === "textured" && canvasEdgeData.meshData && (
        <>
          <mesh position={[0, h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, config.depth]} />
            <meshBasicMaterial map={canvasEdgeData.meshData.topTex} toneMapped={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
          <mesh position={[0, -h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, config.depth]} />
            <meshBasicMaterial map={canvasEdgeData.meshData.bottomTex} toneMapped={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
          <mesh position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[config.depth, h]} />
            <meshBasicMaterial map={canvasEdgeData.meshData.leftTex} toneMapped={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
          <mesh position={[w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[config.depth, h]} />
            <meshBasicMaterial map={canvasEdgeData.meshData.rightTex} toneMapped={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
        </>
      )}

      {/* Plexiglass: layered structure — 2mm plexi top, image, 3mm dibond backing */}
      {isPlexiglass && (() => {
        const plexiD = config.plexiDepth ?? 0.2 * SCALE;
        const dibondD = config.dibondDepth ?? 0.3 * SCALE;
        const totalD = config.depth;
        // Dibond backing layer (bottom) — silver/white aluminum composite
        const dibondZ = -totalD / 2 + dibondD / 2;
        // Plexi layer (top) — transparent acrylic
        const plexiZ = totalD / 2 - plexiD / 2;
        return (
          <group>
            {/* Dibond backing — aluminum composite panel */}
            <RoundedBox args={[w, h, dibondD]} radius={config.radius} smoothness={4} position={[0, 0, dibondZ]}>
              <meshBasicMaterial color="#c8c8c8" toneMapped={false} />
            </RoundedBox>
            {/* Transparent plexi top layer with glass-like reflection */}
            <RoundedBox args={[w * 1.001, h * 1.001, plexiD]} radius={config.radius} smoothness={4} position={[0, 0, plexiZ]}>
              <meshPhysicalMaterial
                transparent opacity={0.15} color="#f0f5ff"
                metalness={0.02} roughness={0.05} clearcoat={0.8} clearcoatRoughness={0.08}
                toneMapped={false}
              />
            </RoundedBox>
            {/* Visible plexi edge — clear acrylic side strips */}
            {/* Top edge */}
            <mesh position={[0, h / 2, plexiZ]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, plexiD]} />
              <meshPhysicalMaterial transparent opacity={0.25} color="#e8f0ff" roughness={0.05} clearcoat={1} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            {/* Bottom edge */}
            <mesh position={[0, -h / 2, plexiZ]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, plexiD]} />
              <meshPhysicalMaterial transparent opacity={0.25} color="#e8f0ff" roughness={0.05} clearcoat={1} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            {/* Left edge */}
            <mesh position={[-w / 2, 0, plexiZ]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[plexiD, h]} />
              <meshPhysicalMaterial transparent opacity={0.25} color="#e8f0ff" roughness={0.05} clearcoat={1} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            {/* Right edge */}
            <mesh position={[w / 2, 0, plexiZ]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[plexiD, h]} />
              <meshPhysicalMaterial transparent opacity={0.25} color="#e8f0ff" roughness={0.05} clearcoat={1} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })()}

      {/* HD Metal silver back face — not needed, extruded shape provides it */}

      {/* HD Metal back-side subframe with mitered 45° corners */}
      {productSlug === "hd-metal" && subframeData && (() => {
        const insetCm = subframeData.inset_cm;
        const sfW = subframeData.width_cm * SCALE;
        const sfD = subframeData.height_cm * SCALE;
        const rawColor = (subframeData.color || "black").toLowerCase();
        const colorMap: Record<string, string> = { black: "#1a1a1a", white: "#e8e8e8", silver: "#b0b0b0" };
        const sfColor = colorMap[rawColor] || (rawColor.startsWith("#") ? rawColor : "#1a1a1a");
        const centerW = (totalW - insetCm * 2) * SCALE;
        const centerH = (totalH - insetCm * 2) * SCALE;
        const outerW = centerW + sfW;
        const outerH = centerH + sfW;
        const innerW2 = centerW - sfW;
        const innerH2 = centerH - sfW;
        const zBack = -(config.depth / 2) - sfD;

        // 4 trapezoids for 45° mitered corners — stronger contrast to make joints visible
        const sfTopCol = new THREE.Color(adjustColor(sfColor, 0.2));
        const sfBottomCol = new THREE.Color(adjustColor(sfColor, -0.25));
        const sfLeftCol = new THREE.Color(adjustColor(sfColor, 0.1));
        const sfRightCol = new THREE.Color(adjustColor(sfColor, -0.12));

        const sfTop = new THREE.Shape();
        sfTop.moveTo(-outerW / 2, outerH / 2);
        sfTop.lineTo(outerW / 2, outerH / 2);
        sfTop.lineTo(innerW2 / 2, innerH2 / 2);
        sfTop.lineTo(-innerW2 / 2, innerH2 / 2);
        sfTop.closePath();

        const sfBottom = new THREE.Shape();
        sfBottom.moveTo(-outerW / 2, -outerH / 2);
        sfBottom.lineTo(outerW / 2, -outerH / 2);
        sfBottom.lineTo(innerW2 / 2, -innerH2 / 2);
        sfBottom.lineTo(-innerW2 / 2, -innerH2 / 2);
        sfBottom.closePath();

        const sfLeft = new THREE.Shape();
        sfLeft.moveTo(-outerW / 2, outerH / 2);
        sfLeft.lineTo(-innerW2 / 2, innerH2 / 2);
        sfLeft.lineTo(-innerW2 / 2, -innerH2 / 2);
        sfLeft.lineTo(-outerW / 2, -outerH / 2);
        sfLeft.closePath();

        const sfRight = new THREE.Shape();
        sfRight.moveTo(outerW / 2, outerH / 2);
        sfRight.lineTo(innerW2 / 2, innerH2 / 2);
        sfRight.lineTo(innerW2 / 2, -innerH2 / 2);
        sfRight.lineTo(outerW / 2, -outerH / 2);
        sfRight.closePath();

        const sfExtOpts = { depth: sfD, bevelEnabled: false };

        return (
          <group>
            <mesh position={[0, 0, zBack]}>
              <extrudeGeometry args={[sfTop, sfExtOpts]} />
              <meshBasicMaterial color={sfTopCol} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, zBack]}>
              <extrudeGeometry args={[sfBottom, sfExtOpts]} />
              <meshBasicMaterial color={sfBottomCol} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, zBack]}>
              <extrudeGeometry args={[sfLeft, sfExtOpts]} />
              <meshBasicMaterial color={sfLeftCol} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, zBack]}>
              <extrudeGeometry args={[sfRight, sfExtOpts]} />
              <meshBasicMaterial color={sfRightCol} toneMapped={false} />
            </mesh>
          </group>
        );
      })()}

      {/* Dibond / Plexiglass hanging spacer */}
      {(productSlug === "dibond" || productSlug === "plexiglass") && (
        <mesh position={[0, 0, -config.depth / 2 - 0.08]}>
          <boxGeometry args={[w * 0.6, 0.06, 0.14]} />
          <meshBasicMaterial color="#444444" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function CameraController({ props }: { props: Product3DPreviewProps }) {
  const { camera, size } = useThree();
  const totalW = props.widthCm + (props.borders?.left ?? 0) + (props.borders?.right ?? 0) + (props.frameWidthCm ?? 0) * 2;
  const totalH = props.heightCm + (props.borders?.top ?? 0) + (props.borders?.bottom ?? 0) + (props.frameWidthCm ?? 0) * 2;
  const w = totalW * SCALE;
  const h = totalH * SCALE;

  useMemo(() => {
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const aspect = size.width / size.height;
    // Calculate distance needed to fit both width and height with padding
    const distH = (h / 2) / Math.tan(fov / 2);
    const distW = (w / 2) / (Math.tan(fov / 2) * aspect);
    const dist = Math.max(distH, distW) * 1.35; // 35% padding
    (camera as THREE.PerspectiveCamera).position.set(0, 0, dist);
    camera.updateProjectionMatrix();
  }, [camera, size, w, h]);

  return null;
}

function SceneContent(props: Product3DPreviewProps) {
  const totalW = props.widthCm + (props.borders?.left ?? 0) + (props.borders?.right ?? 0) + (props.frameWidthCm ?? 0) * 2;
  const totalH = props.heightCm + (props.borders?.top ?? 0) + (props.borders?.bottom ?? 0) + (props.frameWidthCm ?? 0) * 2;
  const maxDim = Math.max(totalW, totalH) * SCALE;

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 4]} intensity={0.5} color="#ffffff" />
      <directionalLight position={[-3, 1, -2]} intensity={0.25} color="#ffffff" />
      <directionalLight position={[0, -1, -4]} intensity={0.15} color="#ffffff" />
      <CameraController props={props} />
      <Suspense fallback={null}>
        <PrintMesh {...props} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={maxDim * 0.5}
        maxDistance={maxDim * 4}
        autoRotate={false}
        target={[0, 0, 0]}
      />
    </>
  );
}

const Product3DPreview = (props: Product3DPreviewProps) => {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping, logarithmicDepthBuffer: true }}
        style={{ background: "#bdbdbd", width: "100%", height: "100%" }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
};

export default Product3DPreview;
