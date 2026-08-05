"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;

export type ImageDraft = {
  id: string;
  file: File;
  preview: string;
};

type ImageDropzoneProps = {
  images: ImageDraft[];
  onChange: (images: ImageDraft[]) => void;
  onError: (message: string | null) => void;
  maxFiles?: number;
};

function makeDraft(file: File): ImageDraft {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    file,
    preview: URL.createObjectURL(file),
  };
}

export function ImageDropzone({
  images,
  onChange,
  onError,
  maxFiles = MAX_FILES,
}: ImageDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // Sempre aponta para a lista mais recente — o cleanup do unmount roda numa
  // closure "congelada" no primeiro render, então sem o ref ele revogaria
  // sempre o array vazio inicial e vazaria as blob URLs criadas depois.
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // Se o pai substituir a lista inteira (ex.: limpar o formulário depois de
  // publicar), revoga as blob URLs que saíram — revokeObjectURL numa URL já
  // revogada (ex.: por removeAt) é inofensivo, então não há risco de duplicar.
  const prevImagesRef = useRef<ImageDraft[]>(images);
  useEffect(() => {
    const currentIds = new Set(images.map((i) => i.id));
    for (const prev of prevImagesRef.current) {
      if (!currentIds.has(prev.id)) {
        URL.revokeObjectURL(prev.preview);
      }
    }
    prevImagesRef.current = images;
  }, [images]);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const incoming = Array.from(list);
      const next = [...images];
      for (const file of incoming) {
        if (next.length >= maxFiles) {
          onError(`Você pode enviar no máximo ${maxFiles} fotos.`);
          break;
        }
        if (!ALLOWED.includes(file.type)) {
          onError("Envie apenas imagens JPG, PNG, WEBP ou GIF.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          onError("Cada imagem deve ter no máximo 5 MB.");
          continue;
        }
        next.push(makeDraft(file));
      }
      if (next.length > images.length) {
        onError(null);
        onChange(next);
      }
    },
    [images, maxFiles, onChange, onError],
  );

  const removeAt = (index: number) => {
    const target = images[index];
    if (target) URL.revokeObjectURL(target.preview);
    onChange(images.filter((_, i) => i !== index));
    onError(null);
  };

  return (
    <div className="flex flex-col gap-2 text-sm font-medium text-navy/80">
      <span>
        Fotos do item{" "}
        <span className="font-normal text-muted">
          (até {maxFiles} · arraste ou clique)
        </span>
      </span>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          if (e.dataTransfer.files?.length) {
            addFiles(e.dataTransfer.files);
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-soft ${
          dragging
            ? "border-brand bg-brand/5 ring-2 ring-brand/20"
            : "border-fog bg-white hover:border-brand hover:bg-mist/40"
        }`}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="text-2xl" aria-hidden>
          📷
        </span>
        <span className="text-sm font-semibold text-navy">
          {dragging
            ? "Solte as imagens aqui"
            : "Arraste fotos ou clique para selecionar"}
        </span>
        <span className="text-xs font-normal text-muted">
          JPG, PNG, WEBP ou GIF · máx. 5 MB cada · {images.length}/{maxFiles}
        </span>
      </div>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, index) => (
            <li
              key={img.id}
              className="relative overflow-hidden rounded-xl border border-fog bg-mist"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt={`Foto ${index + 1}`}
                className="h-28 w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-navy/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Capa
                </span>
              )}
              <button
                type="button"
                aria-label={`Remover foto ${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(index);
                }}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-navy shadow-sm transition-soft hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
