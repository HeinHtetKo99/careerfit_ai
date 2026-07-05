import { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function DropZone({ onFileSelect, disabled }) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  function handleDragOver(e) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`dropzone flex cursor-pointer flex-col items-center justify-center px-6 py-12 ${
        disabled ? 'dropzone-disabled' : ''
      } ${isDragging ? 'dropzone-active' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50">
        <svg
          className="h-7 w-7 text-sky-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      <p className="mb-1 text-sm font-semibold text-slate-800">
        {isDragging ? t('dropzone.dragActive') : t('dropzone.dragIdle')}
      </p>
      <p className="text-xs text-slate-500">{t('dropzone.hint')}</p>
    </div>
  );
}
