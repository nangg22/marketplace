"use client";

import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useState } from "react";
import Image from "next/image";
import { X, Star } from "lucide-react";

interface ImageItem {
  url: string;
  isPrimary: boolean;
}

export default function ProductImageUploader({
  images,
  onChange,
}: {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}) {
  function handleUploadComplete(res: { url: string }[]) {
    const newImages = res.map((f, i) => ({
      url: f.url,
      isPrimary: images.length === 0 && i === 0,
    }));
    onChange([...images, ...newImages]);
  }

  function removeImage(url: string) {
    onChange(images.filter((img) => img.url !== url));
  }

  function setPrimary(url: string) {
    onChange(images.map((img) => ({ ...img, isPrimary: img.url === url })));
  }

  return (
    <div className="space-y-3">
      <UploadDropzone<OurFileRouter, "imageUploader">
        endpoint="imageUploader"
        onClientUploadComplete={handleUploadComplete}
        onUploadError={(err) => alert(`Gagal upload: ${err.message}`)}
      />
      <div className="grid grid-cols-4 gap-2 mt-4">
        {images.map((img) => (
          <div key={img.url} className="relative group">
            <Image
              src={img.url}
              alt="preview"
              width={100}
              height={100}
              className={`rounded-md object-cover w-full h-24 border-2 ${
                img.isPrimary ? "border-black" : "border-transparent"
              }`}
            />
            <button
              type="button"
              onClick={() => setPrimary(img.url)}
              className="absolute top-1 left-1 bg-white/80 rounded-full p-1"
              title="Jadikan foto utama"
            >
              <Star size={14} fill={img.isPrimary ? "#facc15" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => removeImage(img.url)}
              className="absolute top-1 right-1 bg-white/80 rounded-full p-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
