"use client"
/* eslint-disable */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useCompany } from "@/components/company-provider"
import { createClient } from "@/lib/supabase/client"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { toast } from "sonner"
import type { LetterPad } from "@/types"

const letterPadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  letter_date: z.date(),
  subject: z.string().optional(),
  content: z.string().min(1, "Content is required"),
})

type LetterPadFormValues = z.infer<typeof letterPadSchema>

interface LetterPadFormProps {
  initialData?: LetterPad | null
}

export function LetterPadForm({ initialData }: LetterPadFormProps) {
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LetterPadFormValues>({
    resolver: zodResolver(letterPadSchema),
    defaultValues: {
      title: initialData?.title || "",
      letter_date: initialData?.letter_date ? new Date(initialData.letter_date) : new Date(),
      subject: initialData?.subject || "",
      content: initialData?.content || "",
    },
  })

  const onSubmit = async (values: LetterPadFormValues) => {
    if (!selectedCompany) {
      toast.error("No company selected")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        company_id: selectedCompany.id,
        title: values.title,
        letter_date: format(values.letter_date, "yyyy-MM-dd"),
        subject: values.subject || null,
        content: values.content,
      }

      if (initialData?.id) {
        // Update
        const { error } = await supabase
          .from("letter_pads")
          .update(payload)
          .eq("id", initialData.id)

        if (error) throw error
        toast.success("Letter Pad updated successfully")
      } else {
        // Create
        const { error } = await supabase
          .from("letter_pads")
          .insert(payload)

        if (error) throw error
        toast.success("Letter Pad created successfully")
      }

      router.push("/admin/letter-pads")
      router.refresh()
    } catch (error) {
      console.error("Error saving Letter Pad:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save Letter Pad")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Letter Pad" : "Create New Letter Pad"}</CardTitle>
          <CardDescription>
            Create a professional letter on your company letterhead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Letter Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Offer Letter - John Doe"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="letter_date">Letter Date *</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("letter_date") && "text-muted-foreground"
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("letter_date") ? (
                      format(form.watch("letter_date"), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch("letter_date")}
                      onSelect={(date) => date && form.setValue("letter_date", date)}
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.letter_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.letter_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                placeholder="Subject of the letter"
                {...form.register("subject")}
              />
            </div>

            <div className="space-y-2">
              <Label>Letter Content *</Label>
              <RichTextEditor
                value={form.watch("content")}
                onChange={(value) => form.setValue("content", value)}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update" : "Save"} Letter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
