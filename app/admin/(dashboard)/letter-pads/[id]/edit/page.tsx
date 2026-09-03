import { LetterPadEditClient } from "@/components/letter-pads/LetterPadEditClient"

export const metadata = {
  title: "Edit Letter Pad",
}

export default function EditLetterPadPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <LetterPadEditClient />
    </div>
  )
}
