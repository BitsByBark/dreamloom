export type BackgroundComputedValues = {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundAttachment?: string;
  backgroundOrigin?: string;
  backgroundClip?: string;
};

export type BackgroundDraft = {
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  backgroundAttachment: string;
  backgroundOrigin: string;
  backgroundClip: string;
};

export const BACKGROUND_SIZE_TOGGLES = [
  { value: "auto", glyph: "A", label: "Auto" },
  { value: "cover", glyph: "▣", label: "Cover" },
  { value: "contain", glyph: "□", label: "Contain" },
] as const;

export const BACKGROUND_POSITION_TOGGLES = [
  { value: "center", glyph: "⊙", label: "Center" },
  { value: "top", glyph: "↑", label: "Top" },
  { value: "bottom", glyph: "↓", label: "Bottom" },
  { value: "left", glyph: "←", label: "Left" },
  { value: "right", glyph: "→", label: "Right" },
] as const;
export const BACKGROUND_REPEAT_OPTIONS = [
  "repeat",
  "no-repeat",
  "repeat-x",
  "repeat-y",
  "space",
  "round",
] as const;
export const BACKGROUND_ATTACHMENT_OPTIONS = ["scroll", "fixed", "local"] as const;
export const BACKGROUND_ORIGIN_OPTIONS = ["border-box", "padding-box", "content-box"] as const;
export const BACKGROUND_CLIP_OPTIONS = ["border-box", "padding-box", "content-box", "text"] as const;

export function emptyBackgroundDraft(): BackgroundDraft {
  return {
    backgroundColor: "",
    backgroundImage: "",
    backgroundSize: "",
    backgroundPosition: "",
    backgroundRepeat: "",
    backgroundAttachment: "",
    backgroundOrigin: "",
    backgroundClip: "",
  };
}

export function backgroundDraftFromComputed(values: BackgroundComputedValues): BackgroundDraft {
  const empty = emptyBackgroundDraft();
  return {
    backgroundColor: values.backgroundColor ?? empty.backgroundColor,
    backgroundImage: values.backgroundImage ?? empty.backgroundImage,
    backgroundSize: values.backgroundSize ?? empty.backgroundSize,
    backgroundPosition: values.backgroundPosition ?? empty.backgroundPosition,
    backgroundRepeat: values.backgroundRepeat ?? empty.backgroundRepeat,
    backgroundAttachment: values.backgroundAttachment ?? empty.backgroundAttachment,
    backgroundOrigin: values.backgroundOrigin ?? empty.backgroundOrigin,
    backgroundClip: values.backgroundClip ?? empty.backgroundClip,
  };
}
