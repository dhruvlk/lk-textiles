import { LetterPadsClient } from "@/components/letter-pads/LetterPadsClient"

export const metadata = {
  title: "Letter Pads",
}

export default function LetterPadsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <LetterPadsClient />
    </div>
  )
}
