"use client"
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useEffect, useState } from "react"
import { useCompany } from "@/components/company-provider"
import { ProductFormDialog } from "@/components/products/product-form-dialog"
import { Pencil, Trash2, Package } from "lucide-react"
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/services/products.service"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"

export default function ProductsClient() {
  const { selectedCompany } = useCompany()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const loadProducts = async () => {
    if (!selectedCompany) return
    setIsLoading(true)
    try {
      const data = await getProducts(selectedCompany.id, search)
      setProducts(data)
    } catch {
      toast.error("Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [selectedCompany, search])

  const handleProductSaved = async (product: Product) => {
    if (product.id && products.some((p) => p.id === product.id)) {
      await updateProduct(product)
    } else {
      await addProduct(product)
    }
    await loadProducts()
  }

  const confirmDelete = async () => {
    if (!productToDelete) return
    try {
      await deleteProduct(productToDelete.id)
      toast.success("Product deleted.")
      await loadProducts()
    } catch {
      toast.error("Failed to delete product")
    }
    setDeleteDialogOpen(false)
    setProductToDelete(null)
  }

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Package}
        title="Select a company"
        description="Choose a company from the header to manage products."
      />
    )
  }

  const columns = [
    { header: "Name", accessorKey: "name" as keyof Product, className: "font-medium" },
    { header: "HSN", cell: (p: Product) => p.hsn_code || "-" },
    { header: "Unit", cell: (p: Product) => p.unit },
    { header: "Rate", cell: (p: Product) => `₹${p.default_rate.toFixed(2)}` },
    { header: "Description", cell: (p: Product) => p.description || "-" },
    {
      header: "Actions",
      className: "text-right",
      cell: (p: Product) => (
        <div className="flex justify-end gap-2">
          <ProductFormDialog
            initialData={p}
            onProductSaved={handleProductSaved}
            trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
          />
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setProductToDelete(p); setDeleteDialogOpen(true) }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description={`Manage product master for ${selectedCompany.name}`}
        action={<ProductFormDialog onProductSaved={handleProductSaved} />}
      />

      <DataTable
        data={products}
        columns={columns}
        searchValue={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        searchPlaceholder="Search products..."
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Delete ${productToDelete?.name}?`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}
