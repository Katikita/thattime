export type PostcardPayload = {
  id: string;
  createdAt: string;
  templateVersion: number;
  uploadedImage: string; // dataURL
  caption: string;
  toName: string;
  message: string;
  fromName: string;
};

const KEY_PREFIX = "postcard:";

export function savePostcard(p: PostcardPayload) {
  localStorage.setItem(KEY_PREFIX + p.id, JSON.stringify(p));
}

export function loadPostcard(id: string): PostcardPayload | null {
  const raw = localStorage.getItem(KEY_PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PostcardPayload;
  } catch {
    return null;
  }
}
