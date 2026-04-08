import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type Tab = "crop" | "color" | "text";

const STANDARD_RATIOS = [
  { label: "1:1", value: 1 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "5:4", value: 5 / 4 },
  { label: "4:5", value: 4 / 5 },
  { label: "2:1", value: 2 },
  { label: "1:2", value: 0.5 },
  { label: "3:1", value: 3 },
  { label: "1:3", value: 1 / 3 },
  { label: "4:1", value: 4 },
  { label: "1:4", value: 0.25 },
];

const FONTS = [
  { name: "Arial", label: "Arial" },
  { name: "Georgia", label: "Georgia" },
  { name: "Times New Roman", label: "Times New Roman" },
  { name: "Verdana", label: "Verdana" },
  { name: "Courier New", label: "Courier New" },
  { name: "Impact", label: "Impact" },
  { name: "Comic Sans MS", label: "Comic Sans" },
  { name: "'David Libre', serif", label: "David (עברית)" },
  { name: "'Heebo', sans-serif", label: "Heebo (עברית)" },
  { name: "'Rubik', sans-serif", label: "Rubik (עברית)" },
  { name: "'Assistant', sans-serif", label: "Assistant (עברית)" },
  { name: "'Frank Ruhl Libre', serif", label: "Frank Ruhl (עברית)" },
];

const HEBREW_FONT_LINK = "https://fonts.googleapis.com/css2?family=David+Libre:wght@400;700&family=Heebo:wght@400;700&family=Rubik:wght@400;700&family=Assistant:wght@400;700&family=Frank+Ruhl+Libre:wght@400;700&display=swap";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface PhotoEditorProps {
  imageUrl: string;
  aspectRatio?: string;
  onDone: (editedDataUrl: string, newAspectRatio?: string) => void;
  onCancel: () => void;
  onReset?: () => void;
}

const PhotoEditor = ({ imageUrl, aspectRatio, onDone, onCancel, onReset }: PhotoEditorProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("crop");
  const imgRef = useRef<HTMLImageElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.querySelector(`link[href*="David+Libre"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = HEBREW_FONT_LINK;
      document.head.appendChild(link);
    }
  }, []);

  const [selectedRatioLabel, setSelectedRatioLabel] = useState(aspectRatio ?? "1:1");
  const selectedRatio = STANDARD_RATIOS.find((r) => r.label === selectedRatioLabel);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textFont, setTextFont] = useState("Arial");
  const [textSize, setTextSize] = useState(48);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    setTextOverlays((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newText, x: 50, y: 50, fontSize: textSize, color: textColor, fontFamily: textFont },
    ]);
    setNewText("");
  };

  const removeText = (id: string) => setTextOverlays((prev) => prev.filter((t) => t.id !== id));

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setDraggingId(id);
  };

  useEffect(() => {
    if (!draggingId) return;
    const container = previewContainerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setTextOverlays((prev) => prev.map((t) => t.id === draggingId ? { ...t, x, y } : t));
    };
    const handleUp = () => setDraggingId(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [draggingId]);

  const handleDone = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      sx = completedCrop.x * scaleX;
      sy = completedCrop.y * scaleY;
      sw = completedCrop.width * scaleX;
      sh = completedCrop.height * scaleY;
    }

    canvas.width = sw;
    canvas.height = sh;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    ctx.filter = "none";

    const dispScaleX = sw / (completedCrop?.width ?? img.width);
    const dispScaleY = sh / (completedCrop?.height ?? img.height);

    textOverlays.forEach((t) => {
      const fontSize = t.fontSize * Math.min(dispScaleX, dispScaleY);
      ctx.font = `${fontSize}px ${t.fontFamily}`;
      ctx.fillStyle = t.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.text, (t.x / 100) * sw, (t.y / 100) * sh);
    });

    const newRatio = selectedRatioLabel;
    onDone(canvas.toDataURL("image/jpeg", 0.92), newRatio);
  }, [completedCrop, brightness, contrast, saturation, textOverlays, onDone, selectedRatioLabel]);

  const tabs: { id: Tab; labelKey: string }[] = [
    { id: "crop", labelKey: "editor.crop" },
    { id: "color", labelKey: "editor.color" },
    { id: "text", labelKey: "editor.text" },
  ];

  return (
    <div className="border border-border rounded-sm bg-card overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn(
              "flex-1 px-4 py-3 font-body text-sm transition-colors",
              tab === tb.id
                ? "bg-accent/10 text-accent border-b-2 border-accent font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      {/* Image preview */}
      <div
        ref={previewContainerRef}
        className="relative bg-secondary/30 flex items-center justify-center p-4 max-h-[400px] overflow-hidden"
      >
        {tab === "crop" ? (
          <ReactCrop
            crop={crop}
            onChange={setCrop}
            onComplete={setCompletedCrop}
            aspect={selectedRatio?.value}
            className="max-h-[360px]"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Edit"
              style={{ ...filterStyle, maxHeight: 360, objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        ) : (
          <div className="relative">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Edit"
              style={{ ...filterStyle, maxHeight: 360, objectFit: "contain" }}
              crossOrigin="anonymous"
            />
            {textOverlays.map((overlay) => (
              <div
                key={overlay.id}
                className={cn("absolute cursor-move select-none", draggingId === overlay.id && "ring-2 ring-accent rounded px-1")}
                style={{
                  left: `${overlay.x}%`,
                  top: `${overlay.y}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: overlay.fontSize * 0.5,
                  color: overlay.color,
                  fontFamily: overlay.fontFamily,
                  textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                  whiteSpace: "nowrap",
                }}
                onMouseDown={(e) => handleMouseDown(e, overlay.id)}
              >
                {overlay.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {tab === "crop" && (
          <div className="space-y-3">
            <p className="font-body text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">{t("editor.aspectRatio")}</p>
            <div className="flex flex-wrap gap-2">
              {STANDARD_RATIOS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => {
                    setSelectedRatioLabel(r.label);
                    // Auto-initialize a centered crop for the selected ratio
                    const img = imgRef.current;
                    if (img && r.value != null) {
                      const imgAspect = img.width / img.height;
                      const ratioVal = r.value;
                      let cropW: number, cropH: number;
                      if (ratioVal > imgAspect) {
                        cropW = 100;
                        cropH = (imgAspect / ratioVal) * 100;
                      } else {
                        cropH = 100;
                        cropW = (ratioVal / imgAspect) * 100;
                      }
                      const newCrop: Crop = {
                        unit: "%",
                        x: (100 - cropW) / 2,
                        y: (100 - cropH) / 2,
                        width: cropW,
                        height: cropH,
                      };
                      setCrop(newCrop);
                      // Also set completedCrop in pixel terms
                      const pc: PixelCrop = {
                        unit: "px",
                        x: ((100 - cropW) / 200) * img.width,
                        y: ((100 - cropH) / 200) * img.height,
                        width: (cropW / 100) * img.width,
                        height: (cropH / 100) * img.height,
                      };
                      setCompletedCrop(pc);
                    } else {
                      setCrop(undefined);
                      setCompletedCrop(undefined);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 border rounded-sm font-body text-xs transition-all",
                    selectedRatioLabel === r.label
                      ? "border-accent bg-accent/10 text-accent font-semibold"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="font-body text-xs text-muted-foreground">
              {t("editor.cropHint")}
            </p>
          </div>
        )}

        {tab === "color" && (
          <div className="space-y-4">
            {[
              { labelKey: "editor.brightness", value: brightness, set: setBrightness },
              { labelKey: "editor.contrast", value: contrast, set: setContrast },
              { labelKey: "editor.saturation", value: saturation, set: setSaturation },
            ].map(({ labelKey, value, set }) => (
              <div key={labelKey}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-body text-xs text-muted-foreground">{t(labelKey)}</span>
                  <span className="font-body text-sm text-foreground font-medium">{value}%</span>
                </div>
                <Slider min={0} max={200} step={1} value={[value]} onValueChange={([v]) => set(v)} />
              </div>
            ))}
            <button
              onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}
              className="font-body text-xs text-accent hover:underline"
            >
              {t("editor.resetDefaults")}
            </button>
          </div>
        )}

        {tab === "text" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder={t("editor.enterText")}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addTextOverlay()}
              />
              <button
                onClick={addTextOverlay}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-sm font-body text-sm hover:bg-accent/90 transition-colors"
              >
                {t("editor.add")}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <span className="font-body text-xs text-muted-foreground block mb-1">{t("editor.colorLabel")}</span>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 cursor-pointer" />
              </div>
              <div>
                <span className="font-body text-xs text-muted-foreground block mb-1">{t("editor.sizeLabel")}</span>
                <Input type="number" min={12} max={120} value={textSize} onChange={(e) => setTextSize(+e.target.value)} className="w-20" />
              </div>
              <div className="flex-1 min-w-[140px]">
                <span className="font-body text-xs text-muted-foreground block mb-1">{t("editor.fontLabel")}</span>
                <select
                  value={textFont}
                  onChange={(e) => setTextFont(e.target.value)}
                  className="w-full border border-border rounded-sm p-2 bg-background text-foreground font-body text-sm"
                >
                  {FONTS.map((f) => (
                    <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="font-body text-[11px] text-muted-foreground">
              {t("editor.dragTip")}
            </p>
            {textOverlays.length > 0 && (
              <div className="space-y-2">
                {textOverlays.map((overlay) => (
                  <div key={overlay.id} className="flex items-center justify-between bg-secondary/50 rounded-sm px-3 py-2">
                    <span className="font-body text-sm" style={{ color: overlay.color, fontFamily: overlay.fontFamily }}>
                      {overlay.text}
                    </span>
                    <button onClick={() => removeText(overlay.id)} className="font-body text-xs text-destructive hover:underline">
                      {t("editor.removeText")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setCrop(undefined);
              setCompletedCrop(undefined);
              setBrightness(100);
              setContrast(100);
              setSaturation(100);
              setTextOverlays([]);
              setSelectedRatioLabel(aspectRatio ?? "1:1");
              onReset?.();
              onCancel();
            }}
            className="px-4 py-3 border border-destructive/40 rounded-sm font-body text-sm text-destructive hover:bg-destructive/10 hover:border-destructive transition-colors"
          >
            {t("editor.resetOriginal")}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-border rounded-sm font-body text-sm text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
          >
            {t("editor.cancel")}
          </button>
          <button
            onClick={handleDone}
            className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-sm font-body text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            {t("editor.apply")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;
