"use client"

import React, { useMemo, useEffect } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading2,
  Heading3,
  Pilcrow,
  Undo2,
  Redo2,
  RemoveFormatting,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface LegalContentEditorProps {
  title: string
  description: string
  content: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onContentChange: (value: string) => void
  disabled?: boolean
}

const LegalMenuBar = ({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) => {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 p-2 rounded-t-2xl">
      {/* Headings & Paragraph */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={cn(
          "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1",
          editor.isActive("paragraph")
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Normal Paragraph"
      >
        <Pilcrow className="w-3.5 h-3.5" />
        <span>Text</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1",
          editor.isActive("heading", { level: 2 })
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Heading 2 (Section Title)"
      >
        <Heading2 className="w-3.5 h-3.5" />
        <span>H2</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1",
          editor.isActive("heading", { level: 3 })
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Heading 3 (Sub-heading)"
      >
        <Heading3 className="w-3.5 h-3.5" />
        <span>H3</span>
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Formatting: Bold, Italic, Underline */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-2 rounded-lg text-xs transition-colors",
          editor.isActive("bold")
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "p-2 rounded-lg text-xs transition-colors",
          editor.isActive("italic")
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          "p-2 rounded-lg text-xs transition-colors",
          editor.isActive("underline")
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Lists */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-2 rounded-lg text-xs transition-colors",
          editor.isActive("bulletList")
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "p-2 rounded-lg text-xs transition-colors",
          editor.isActive("orderedList")
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Alignments */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={cn(
          "p-2 rounded-lg text-xs transition-colors",
          editor.isActive({ textAlign: "left" })
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={cn(
          "p-2 rounded-lg text-xs transition-colors",
          editor.isActive({ textAlign: "center" })
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={cn(
          "p-2 rounded-lg text-xs transition-colors",
          editor.isActive({ textAlign: "right" })
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        className={cn(
          "p-2 rounded-lg text-xs transition-colors",
          editor.isActive({ textAlign: "justify" })
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
        )}
        title="Align Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Clear Formatting */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="p-2 rounded-lg text-xs text-slate-500 hover:bg-slate-200/80 hover:text-slate-900 transition-colors"
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>

      {/* Undo / Redo */}
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded-lg text-xs text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function LegalContentEditor({
  title,
  description,
  content,
  onTitleChange,
  onDescriptionChange,
  onContentChange,
  disabled = false,
}: LegalContentEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        codeBlock: false,
        dropcursor: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    []
  )

  const editor = useEditor({
    extensions,
    content: content || "",
    immediatelyRender: false,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[380px] p-5 text-slate-800 text-sm leading-relaxed max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-bold [&_strong]:text-slate-900",
      },
    },
  })

  // Synchronize editor content if external content changes (e.g. discard or fetch)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", { emitUpdate: false })
    }
  }, [content, editor])

  return (
    <div className="space-y-6">
      {/* Page Title & Description */}
      <div className="grid gap-5">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Page Title</span>
            <span className="text-[11px] font-normal text-slate-400">Displayed as main page header & SEO title</span>
          </Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. Privacy Policy"
            disabled={disabled}
            className="h-11 text-sm bg-white font-medium border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Short Description / Summary</span>
            <span className="text-[11px] font-normal text-slate-400">Used for search engine metadata & page introduction</span>
          </Label>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief introductory summary of this legal document..."
            disabled={disabled}
            className="text-sm bg-white border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 rounded-xl resize-none no-scrollbar"
          />
        </div>
      </div>

      {/* Main Rich Content Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-slate-700">Document Content & Sections</Label>
          <span className="text-[11px] text-slate-400">Use toolbar to format headings, bullet points, and paragraphs</span>
        </div>

        <div
          className={cn(
            "border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/5 transition-all",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          <LegalMenuBar editor={editor} disabled={disabled} />
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
