"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 bg-muted/50 rounded-t-md">
      <button
        type="button"
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('bold') && "bg-muted text-primary")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Toggle bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('italic') && "bg-muted text-primary")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Toggle italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('underline') && "bg-muted text-primary")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Toggle underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <button
        type="button"
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('bulletList') && "bg-muted text-primary")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Toggle bullet list"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('orderedList') && "bg-muted text-primary")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Toggle ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        type="button"
        className={cn("p-2 rounded hover:bg-muted", editor.isActive({ textAlign: 'left' }) && "bg-muted text-primary")}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        aria-label="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn("p-2 rounded hover:bg-muted", editor.isActive({ textAlign: 'center' }) && "bg-muted text-primary")}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        aria-label="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn("p-2 rounded hover:bg-muted", editor.isActive({ textAlign: 'right' }) && "bg-muted text-primary")}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        aria-label="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn("p-2 rounded hover:bg-muted", editor.isActive({ textAlign: 'justify' }) && "bg-muted text-primary")}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        aria-label="Align justify"
      >
        <AlignJustify className="h-4 w-4" />
      </button>
    </div>
  )
}

export function RichTextEditor({ value, onChange, disabled, className }: RichTextEditorProps) {
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: false, // disable headings for simple letter pad
      codeBlock: false,
      horizontalRule: false,
      dropcursor: false,
      strike: false,
      code: false,
      blockquote: false,
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ], [])

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  })

  return (
    <div className={cn("border border-border rounded-md overflow-hidden", className, disabled && "opacity-50 pointer-events-none")}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
