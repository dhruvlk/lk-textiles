import { LetterPadForm } from "@/components/letter-pads/LetterPadForm"

export const metadata = {
  title: "Create Letter Pad",
}

export default function CreateLetterPadPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <LetterPadForm />
    </div>
  )
}
