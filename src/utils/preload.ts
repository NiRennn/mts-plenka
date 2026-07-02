type PreloadResult = {
  src: string;
  ok: boolean;
};

const imageCache = new Map<string, Promise<PreloadResult>>();

export function preloadImage(src: string): Promise<PreloadResult> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  const promise = new Promise<PreloadResult>((resolve) => {
    const img = new Image();
    img.decoding = "async";

    img.onload = async () => {
      try {
        if ("decode" in img) {
          await img.decode();
        }
      } catch {
        // ignore decode errors
      }

      resolve({ src, ok: true });
    };

    img.onerror = () => {
      resolve({ src, ok: false });
    };

    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

export function preloadImageSrcs(srcs: readonly string[]) {
  return Promise.all([...new Set(srcs)].map(preloadImage));
}