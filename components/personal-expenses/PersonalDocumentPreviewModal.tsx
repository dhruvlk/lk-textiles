"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FileText, Image as ImageIcon, Loader2 } from "lucide-react"
import { getPersonalDocumentSignedUrl } from "@/services/personal-expenses.service"
import type { PersonalExpenseDocument } from "@/types/personal-expenses"

interface PersonalDocumentPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: PersonalExpenseDocument | null
}

export function PersonalDocumentPreviewModal({
  open,
  onOpenChange,
  document: doc,
}: PersonalDocumentPreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string>("")
  const [loadingUrl, setLoadingUrl] = useState(false)

  useEffect(() => {
    if (!doc || !open) {
      setSignedUrl("")
      return
    }

    let isMounted = true
    setLoadingUrl(true)

    getPersonalDocumentSignedUrl(doc.storage_path)
      .then((url) => {
        if (isMounted) {
          setSignedUrl(url)
          setLoadingUrl(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoadingUrl(false)
      })

    return () => {
      isMounted = false
    }
  }, [doc, open])

  if (!doc) return null

  const isPdf =
    doc.file_type?.toLowerCase().includes("pdf") ||
    doc.file_name?.toLowerCase().endsWith(".pdf")
  const isImage =
    doc.file_type?.toLowerCase().startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.file_name)

  const downloadFile = () => {
    if (!signedUrl) return
    const a = window.document.createElement("a")
    a.href = signedUrl
    a.download = doc.file_name
    a.target = "_blank"
    a.rel = "noreferrer"
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
  }

  const openNewTab = () => {
    if (!signedUrl) return
    window.open(signedUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[88vh] max-h-[900px] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-background border shadow-2xl">
        <DialogHeader className="p-4 sm:px-6 border-b flex flex-row items-center justify-between space-y-0 shrink-0 bg-muted/30">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-semibold truncate">
                {doc.file_name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate">
                {(doc.file_size / 1024).toFixed(1)} KB · {doc.file_type || "Document"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={openNewTab}
              disabled={!signedUrl || loadingUrl}
              title="Open in new window"
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">New tab</span>
            </Button>
            <Button
              size="sm"
              onClick={downloadFile}
              disabled={!signedUrl || loadingUrl}
              title="Download original document"
            >
              <Download className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 w-full h-full min-h-0 bg-muted/10 p-2 sm:p-4 flex items-center justify-center overflow-auto">
          {loadingUrl ? (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading document preview…</p>
            </div>
          ) : signedUrl ? (
            isPdf ? (
              <iframe
                src={`${signedUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full rounded-lg border bg-white shadow-inner"
                title={doc.file_name}
              />
            ) : isImage ? (
              <div className="max-w-full max-h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signedUrl}
                  alt={doc.file_name}
                  className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-md border"
                />
              </div>
            ) : (
              <div className="text-center p-8 space-y-4">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/60" />
                <div>
                  <p className="text-base font-medium">Preview not available for this file type</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please download the document to inspect it locally.
                  </p>
                </div>
                <Button onClick={downloadFile}>
                  <Download className="h-4 w-4 mr-2" />
                  Download file
                </Button>
              </div>
            )
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              Document could not be loaded or has expired.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
