'use client';

import React, { useState } from 'react';
import { PhotoEditor } from '@/components/editor/PhotoEditor';
import { Toolbar } from '@/components/editor/Toolbar';

export default function EditorPage() {
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      
      <div className="flex flex-col gap-4">
        <Toolbar />
        <div className="border rounded-lg overflow-hidden">
          <PhotoEditor imageUrl={imageUrl} />
        </div>
      </div>
    </div>
  );
} 