"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategorySelect({
  name = "category",
  defaultValue = "",
  required = false,
  className = "",
}: {
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCats(Array.isArray(d) ? d.filter((c: any) => c.isActive) : []));
  }, []);

  return (
    <select name={name} required={required} defaultValue={defaultValue} className={`neo-input ${className}`}>
      <option value="">Pilih kategori...</option>
      {cats.map((c) => (
        <option key={c.id} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
