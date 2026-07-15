"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-44 px-4 py-3 outline-none prose prose-sm max-w-none",
      },
    },
  })
  useEffect(() => {
    if (editor && editor.getHTML() !== value) editor.commands.setContent(value)
  }, [editor, value])
  return (
    <div className="border border-outline-variant bg-white">
      <div className="flex gap-1 border-b border-outline-variant p-2">
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive("bold") ? "secondary" : "ghost"}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Bold
        </Button>
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive("italic") ? "secondary" : "ghost"}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive("bulletList") ? "secondary" : "ghost"}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          List
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
