"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileSignature,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  FileDown,
  Eye,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCompany } from "@/components/company-provider"
import { createClient } from "@/lib/supabase/client"
import type { LetterPad } from "@/types"
import { LetterPadActions } from "./letter-pad-actions"

export function LetterPadsClient() {
  const { selectedCompany } = useCompany()
  const supabase = createClient()
  const router = useRouter()
  
  const [letterPads, setLetterPads] = useState<LetterPad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [letterPadToDelete, setLetterPadToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchLetterPads = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = supabase
        .from("letter_pads")
        .select("*")
        .eq("company_id", selectedCompany?.id as string)
        .order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setLetterPads(data || [])
    } catch (error) {
      toast.error("Failed to fetch letter pads: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompany, supabase])

  useEffect(() => {
    if (selectedCompany) {
      // Defer execution to avoid React Compiler warning about synchronous setState in effect
      const timer = setTimeout(() => {
        fetchLetterPads()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [selectedCompany, fetchLetterPads])


  const handleDelete = async () => {
    if (!letterPadToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("letter_pads").delete().eq("id", letterPadToDelete)
      if (error) throw error
      toast.success("Letter pad deleted")
      fetchLetterPads()
    } catch (error) {
      toast.error("Failed to delete: " + (error as Error).message)
    } finally {
      setIsDeleting(false)
      setLetterPadToDelete(null)
    }
  }

  const handleDuplicate = async (letter: LetterPad) => {
    try {
      const { id, created_at, updated_at, ...rest } = letter
      const payload = {
        ...rest,
        title: `${rest.title} (Copy)`,
      }
      const { error } = await supabase.from("letter_pads").insert(payload)
      if (error) throw error
      toast.success("Letter pad duplicated")
      fetchLetterPads()
    } catch (error) {
      toast.error("Failed to duplicate: " + (error as Error).message)
    }
  }

  const filteredPads = letterPads.filter(pad => 
    pad.title.toLowerCase().includes(search.toLowerCase()) || 
    pad.subject?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Letter Pads</h2>
          <p className="text-muted-foreground">
            Manage and create professional company letters.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/letter-pads/create")}>
            <Plus className="mr-2 h-4 w-4" />
            New Letter
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search letters..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredPads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No letters found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPads.map((pad) => (
                <TableRow key={pad.id}>
                  <TableCell className="font-medium">{pad.title}</TableCell>
                  <TableCell className="text-muted-foreground">{pad.subject || "-"}</TableCell>
                  <TableCell>{format(new Date(pad.letter_date), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" className="h-8 w-8 p-0" />
                        }
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <LetterPadActions letter={pad} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/letter-pads/${pad.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(pad)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setLetterPadToDelete(pad.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!letterPadToDelete} onOpenChange={(open) => !open && setLetterPadToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Letter Pad</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this letter pad? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLetterPadToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
