"use client";

/**
 * WYSIWYG editor for an article's body, used inside `ArticleForm`. Wraps a
 * `contentEditable` div with a formatting toolbar (bold/italic/uppercase,
 * headings, font size, alignment, spellcheck toggle, undo/redo) built on
 * the browser's `document.execCommand`, and emits the resulting HTML string
 * up to the parent on every change.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  Bold,
  CaseUpper,
  Italic,
  Redo2,
  SpellCheck,
  Undo2,
} from "lucide-react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

// Single toolbar button; uses onMouseDown+preventDefault so clicking it
// doesn't steal focus/selection away from the editor.
function ToolbarButton({
  onClick,
  label,
  active = false,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`rounded-lg p-2 transition-colors ${
        active ? "bg-indigo-500/25 text-indigo-300" : "text-gray-300 hover:bg-indigo-500/15 hover:text-indigo-300"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Renders the formatting toolbar and the editable content area, syncing
 * `value` in from outside only when it didn't originate from this editor's
 * own input (to avoid clobbering the browser's native undo history).
 */
export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const [spellcheck, setSpellcheck] = useState(true);
  const [isEmpty, setIsEmpty] = useState(!value || value === "<br>");

  useEffect(() => {
    if (!editorRef.current) return;
    // Only touch the DOM when the change came from outside this component
    // (e.g. clearing the form after publish). Otherwise we'd clobber the
    // browser's own undo history on every keystroke.
    if (value !== lastEmitted.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    lastEmitted.current = value;
    setIsEmpty(!value || value === "<br>");
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastEmitted.current = html;
    setIsEmpty(!html || html === "<br>");
    onChange(html);
  };

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  };

  const toUpperCase = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    const text = range.toString();
    if (!text) return;

    range.deleteContents();
    range.insertNode(document.createTextNode(text.toUpperCase()));
    selection.removeAllRanges();
    emitChange();
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    e.target.value = "";
    if (!val) return;
    editorRef.current?.focus();
    if (val.startsWith("size-")) {
      document.execCommand("fontSize", false, val.replace("size-", ""));
    } else {
      document.execCommand("formatBlock", false, val);
    }
    emitChange();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-white/10 bg-white/2 p-1.5">
        <ToolbarButton onClick={() => exec("undo")} label="Deshacer">
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("redo")} label="Rehacer">
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-white/10" />

        <ToolbarButton onClick={() => exec("bold")} label="Negrita">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} label="Cursiva">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toUpperCase} label="Mayúsculas (selecciona texto primero)">
          <CaseUpper className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-white/10" />

        <select
          defaultValue=""
          onChange={handleStyleChange}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-sm text-gray-300 outline-none hover:bg-indigo-500/15 focus:border-indigo-400"
        >
          <option value="" disabled className="bg-[#0d0c16]">
            Estilo
          </option>
          <option value="p" className="bg-[#0d0c16]">
            Normal
          </option>
          <option value="h1" className="bg-[#0d0c16]">
            Título 1
          </option>
          <option value="h2" className="bg-[#0d0c16]">
            Título 2
          </option>
          <option value="h3" className="bg-[#0d0c16]">
            Título 3
          </option>
          <option value="size-2" className="bg-[#0d0c16]">
            Letra pequeña
          </option>
          <option value="size-3" className="bg-[#0d0c16]">
            Letra normal
          </option>
          <option value="size-5" className="bg-[#0d0c16]">
            Letra grande
          </option>
          <option value="size-6" className="bg-[#0d0c16]">
            Letra muy grande
          </option>
        </select>

        <span className="mx-1 h-5 w-px bg-white/10" />

        <ToolbarButton onClick={() => exec("justifyLeft")} label="Alinear a la izquierda">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyCenter")} label="Centrar">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyFull")} label="Justificar">
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-white/10" />

        <ToolbarButton
          onClick={() => setSpellcheck((s) => !s)}
          label="Revisar ortografía"
          active={spellcheck}
        >
          <SpellCheck className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={spellcheck}
          lang="es"
          onInput={emitChange}
          onBlur={emitChange}
          className="tp-glass-input min-h-44 rounded-t-none rounded-b-xl px-4 py-3 text-white outline-none focus:border-indigo-400 focus:ring focus:ring-indigo-400/30 [&_h1]:mt-2 [&_h1]:mb-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-lg [&_h3]:font-bold"
        />
        {isEmpty && placeholder && (
          <span className="pointer-events-none absolute left-4 top-3 text-gray-500">{placeholder}</span>
        )}
      </div>
    </div>
  );
}
