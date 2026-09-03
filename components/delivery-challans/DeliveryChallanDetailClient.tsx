"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Edit,
  FileText,
  Loader2,
  Printer,
} from "lucide-react"
import { toast } from "sonner"
import { useCompany } from "@/components/company-provider"
import { PageHeader } from "@/components/common/PageHeader"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PageTransition } from "@/components/common/motion"
import { EmptyState } from "@/components/common/EmptyState"
import { DownloadDeliveryChallanButton } from "@/components/delivery-challans/download-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDeliveryChallanById } from "@/services/delivery-challans.service"
import type { DeliveryChallan } from "@/types"
import { staggerContainer, staggerItem } from "@/lib/motion"

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
    </div>
  )
}

export default function DeliveryChallanDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const [challan, setChallan] = useState<DeliveryChallan | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getDeliveryChallanById(id)
        setChallan(data)
      } catch {
        toast.error("Failed to load delivery challan")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!challan || !selectedCompany) {
    return (
      <EmptyState
        icon={FileText}
        title="Delivery challan not found"
        description="It may have been deleted or you do not have access."
        action={
          <Button onClick={() => router.push("/admin/delivery-challans")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Button>
        }
      />
    )
  }

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Delivery Challans"
        title={challan.challan_number}
        description={`Created for ${challan.customer?.name ?? "customer"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/delivery-challans")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/delivery-challans/${challan.id}/print`)}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <DownloadDeliveryChallanButton
              challan={challan}
              company={selectedCompany}
              variant="outline"
              size="default"
              showText
            />
            <PermissionGate module="delivery_challans" action="edit">
              <Button onClick={() => router.push(`/admin/delivery-challans/${challan.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <motion.div
        className="mt-6 grid gap-4 lg:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={staggerItem}>
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Date" value={format(new Date(challan.date), "dd MMM yyyy")} />
              <DetailRow label="Customer" value={challan.customer?.name} />
              <DetailRow label="Quality" value={challan.quality || "—"} />
              <DetailRow label="Broker" value={challan.broker || "—"} />
              <DetailRow label="Delivered By" value={challan.delivered_by || "—"} />
              <DetailRow
                label="Status"
                value={<Badge variant="secondary">{challan.status}</Badge>}
              />
              <DetailRow label="Total Pieces" value={challan.total_pieces} />
              <DetailRow label="Total MTS" value={Number(challan.total_meters).toFixed(2)} />
              <DetailRow label="Total Weight" value={Number(challan.total_weight).toFixed(2)} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Name" value={challan.customer?.name} />
              <DetailRow label="GST" value={challan.customer?.gst_number || "—"} />
              <DetailRow label="Address" value={challan.customer?.address || "—"} />
              <DetailRow label="City" value={challan.customer?.city || "—"} />
              <DetailRow label="Remarks" value={challan.remarks || "—"} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sr</TableHead>
                      <TableHead>Taka No.</TableHead>
                      <TableHead className="text-right">MTS</TableHead>
                      <TableHead className="text-right">Wt.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(challan.items ?? []).map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.taka_no || "—"}</TableCell>
                        <TableCell className="text-right">{Number(item.meters).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{Number(item.weight).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageTransition>
  )
}
