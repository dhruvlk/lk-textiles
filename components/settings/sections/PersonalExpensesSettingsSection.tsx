"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tag,
  FolderTree,
  CreditCard,
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Loader2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import {
  getPersonalExpenseSettings,
  updatePersonalExpenseSettings,
  getPersonalCategories,
  getAllPersonalCategoriesFlat,
  createPersonalCategory,
  updatePersonalCategory,
  deletePersonalCategory,
  isCategoryUsed,
} from "@/services/personal-expenses.service"
import type {
  PersonalExpenseCategory,
  PersonalExpenseSettings,
} from "@/types/personal-expenses"

const CATEGORY_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#64748b", // Slate
]

const CURRENCIES = [
  { code: "INR", label: "INR (₹ Indian Rupee)" },
  { code: "USD", label: "USD ($ US Dollar)" },
  { code: "EUR", label: "EUR (€ Euro)" },
  { code: "GBP", label: "GBP (£ British Pound)" },
  { code: "AED", label: "AED (د.إ UAE Dirham)" },
  { code: "CAD", label: "CAD ($ Canadian Dollar)" },
  { code: "AUD", label: "AUD ($ Australian Dollar)" },
  { code: "SGD", label: "SGD ($ Singapore Dollar)" },
]

type SettingsTab = "categories" | "subcategories" | "payment_methods" | "preferences"

interface PersonalExpensesSettingsSectionProps {
  isModal?: boolean
  onSettingsUpdated?: () => void
}

export function PersonalExpensesSettingsSection({
  isModal = false,
  onSettingsUpdated,
}: PersonalExpensesSettingsSectionProps) {
  const { user } = useAuth()
  const userId = user?.id || ""

  const [activeTab, setActiveTab] = useState<SettingsTab>("categories")
  const [loading, setLoading] = useState(true)

  // Data
  const [settings, setSettings] = useState<PersonalExpenseSettings | null>(null)
  const [categoriesTree, setCategoriesTree] = useState<PersonalExpenseCategory[]>([])
  const [allFlatCategories, setAllFlatCategories] = useState<PersonalExpenseCategory[]>([])

  // Search & Filters
  const [categorySearch, setCategorySearch] = useState("")
  const [subcategorySearch, setSubcategorySearch] = useState("")
  const [subcategoryParentFilter, setSubcategoryParentFilter] = useState("all")

  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PersonalExpenseCategory | null>(null)
  const [categoryNameInput, setCategoryNameInput] = useState("")
  const [categoryColorInput, setCategoryColorInput] = useState("#4f46e5")
  const [categoryActiveInput, setCategoryActiveInput] = useState(true)
  const [savingCategory, setSavingCategory] = useState(false)

  // Subcategory Modal
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<PersonalExpenseCategory | null>(null)
  const [subcategoryNameInput, setSubcategoryNameInput] = useState("")
  const [subcategoryParentInput, setSubcategoryParentInput] = useState("")
  const [subcategoryActiveInput, setSubcategoryActiveInput] = useState(true)
  const [savingSubcategory, setSavingSubcategory] = useState(false)

  // Deletion / Deactivation safety dialog
  const [safetyDialogOpen, setSafetyDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    item: PersonalExpenseCategory
    isUsed: boolean
  } | null>(null)
  const [deletingOrDeactivating, setDeletingOrDeactivating] = useState(false)

  // Payment Methods state
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [newMethodInput, setNewMethodInput] = useState("")
  const [savingMethods, setSavingMethods] = useState(false)

  // Preferences form
  const [prefix, setPrefix] = useState("PE-")
  const [startNum, setStartNum] = useState(1)
  const [defaultCurrency, setDefaultCurrency] = useState("INR")
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("Cash")
  const [defaultCategoryId, setDefaultCategoryId] = useState("")
  const [savingPreferences, setSavingPreferences] = useState(false)

  // Unsaved changes tracking for preferences
  const isPreferencesDirty = useMemo(() => {
    if (!settings) return false
    return (
      prefix !== (settings.expense_number_prefix || "PE-") ||
      startNum !== (settings.starting_number || 1) ||
      defaultCurrency !== (settings.default_currency || "INR") ||
      defaultPaymentMethod !== (settings.default_payment_method || "Cash") ||
      (defaultCategoryId || "") !== (settings.default_category_id || "")
    )
  }, [settings, prefix, startNum, defaultCurrency, defaultPaymentMethod, defaultCategoryId])

  // Load all data
  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [s, tree, flat] = await Promise.all([
        getPersonalExpenseSettings(userId),
        getPersonalCategories(userId),
        getAllPersonalCategoriesFlat(userId),
      ])
      setSettings(s)
      setPrefix(s.expense_number_prefix || "PE-")
      setStartNum(s.starting_number || 1)
      setDefaultCurrency(s.default_currency || "INR")
      setDefaultPaymentMethod(s.default_payment_method || "Cash")
      setDefaultCategoryId(s.default_category_id || "")
      setPaymentMethods(
        s.custom_payment_methods || [
          "Cash",
          "UPI",
          "Credit Card",
          "Debit Card",
          "Bank Transfer",
          "Cheque",
          "Other",
        ]
      )
      setCategoriesTree(tree)
      setAllFlatCategories(flat)
    } catch (err) {
      console.error("Error loading settings:", err)
      toast.error("Failed to load personal expense settings")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId, loadData])

  // Root categories list (for category tab and parent dropdowns)
  const rootCategories = useMemo(() => {
    return categoriesTree
  }, [categoriesTree])

  // Flat subcategories list (all items with parent_id != null)
  const allSubcategories = useMemo(() => {
    const parentMap = new Map<string, string>()
    const parentColorMap = new Map<string, string>()
    rootCategories.forEach((rc) => {
      parentMap.set(rc.id, rc.name)
      parentColorMap.set(rc.id, rc.color || "#4f46e5")
    })

    return allFlatCategories
      .filter((c) => !!c.parent_id)
      .map((c) => ({
        ...c,
        parent_name: parentMap.get(c.parent_id!) || "Category",
        parent_color: parentColorMap.get(c.parent_id!) || "#4f46e5",
      }))
  }, [allFlatCategories, rootCategories])

  // Filtered categories
  const filteredRootCategories = useMemo(() => {
    if (!categorySearch.trim()) return rootCategories
    const q = categorySearch.toLowerCase().trim()
    return rootCategories.filter((c) => c.name.toLowerCase().includes(q))
  }, [rootCategories, categorySearch])

  // Filtered subcategories
  const filteredSubcategories = useMemo(() => {
    return allSubcategories.filter((s) => {
      if (
        subcategoryParentFilter !== "all" &&
        s.parent_id !== subcategoryParentFilter
      ) {
        return false
      }
      if (subcategorySearch.trim()) {
        const q = subcategorySearch.toLowerCase().trim()
        const matchesName = s.name.toLowerCase().includes(q)
        const matchesParent = (s.parent_name || "").toLowerCase().includes(q)
        if (!matchesName && !matchesParent) return false
      }
      return true
    })
  }, [allSubcategories, subcategoryParentFilter, subcategorySearch])

  // --------------------------------------------------------------------------
  // Category CRUD Handlers
  // --------------------------------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategory(null)
    setCategoryNameInput("")
    setCategoryColorInput(CATEGORY_COLORS[0])
    setCategoryActiveInput(true)
    setCategoryModalOpen(true)
  }

  const handleOpenEditCategory = (cat: PersonalExpenseCategory) => {
    setEditingCategory(cat)
    setCategoryNameInput(cat.name)
    setCategoryColorInput(cat.color || "#4f46e5")
    setCategoryActiveInput(cat.is_active)
    setCategoryModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryNameInput.trim()) {
      toast.error("Category name is required")
      return
    }

    setSavingCategory(true)
    try {
      if (editingCategory) {
        await updatePersonalCategory(editingCategory.id, userId, {
          name: categoryNameInput.trim(),
          color: categoryColorInput,
          is_active: categoryActiveInput,
        })
        toast.success(`Category "${categoryNameInput.trim()}" updated`)
      } else {
        await createPersonalCategory(userId, {
          name: categoryNameInput.trim(),
          color: categoryColorInput,
          is_active: categoryActiveInput,
        })
        toast.success(`Category "${categoryNameInput.trim()}" created`)
      }
      setCategoryModalOpen(false)
      await loadData()
      onSettingsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error(editingCategory ? "Failed to update category" : "Failed to create category")
    } finally {
      setSavingCategory(false)
    }
  }

  const handleToggleCategoryActive = async (cat: PersonalExpenseCategory) => {
    try {
      await updatePersonalCategory(cat.id, userId, {
        is_active: !cat.is_active,
      })
      toast.success(
        `Category "${cat.name}" marked as ${!cat.is_active ? "Active" : "Inactive"}`
      )
      await loadData()
      onSettingsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update category status")
    }
  }

  const handleCheckCategoryDelete = async (cat: PersonalExpenseCategory) => {
    try {
      const used = await isCategoryUsed(cat.id, userId)
      setItemToDelete({ item: cat, isUsed: used })
      setSafetyDialogOpen(true)
    } catch (err) {
      console.error(err)
      toast.error("Could not verify category usage")
    }
  }

  const handleExecuteCategoryAction = async (action: "delete" | "deactivate") => {
    if (!itemToDelete) return
    setDeletingOrDeactivating(true)
    try {
      if (action === "deactivate") {
        await updatePersonalCategory(itemToDelete.item.id, userId, {
          is_active: false,
        })
        toast.success(`Category "${itemToDelete.item.name}" deactivated`)
      } else {
        await deletePersonalCategory(itemToDelete.item.id, userId)
        toast.success(`Category "${itemToDelete.item.name}" deleted`)
      }
      setSafetyDialogOpen(false)
      setItemToDelete(null)
      await loadData()
      onSettingsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error(action === "deactivate" ? "Failed to deactivate" : "Failed to delete")
    } finally {
      setDeletingOrDeactivating(false)
    }
  }

  // --------------------------------------------------------------------------
  // Subcategory CRUD Handlers
  // --------------------------------------------------------------------------
  const handleOpenAddSubcategory = () => {
    setEditingSubcategory(null)
    setSubcategoryNameInput("")
    setSubcategoryParentInput(rootCategories.length > 0 ? rootCategories[0].id : "")
    setSubcategoryActiveInput(true)
    setSubcategoryModalOpen(true)
  }

  const handleOpenEditSubcategory = (sub: PersonalExpenseCategory) => {
    setEditingSubcategory(sub)
    setSubcategoryNameInput(sub.name)
    setSubcategoryParentInput(sub.parent_id || "")
    setSubcategoryActiveInput(sub.is_active)
    setSubcategoryModalOpen(true)
  }

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subcategoryNameInput.trim()) {
      toast.error("Subcategory name is required")
      return
    }
    if (!subcategoryParentInput) {
      toast.error("Please select a parent category")
      return
    }

    setSavingSubcategory(true)
    try {
      if (editingSubcategory) {
        await updatePersonalCategory(editingSubcategory.id, userId, {
          name: subcategoryNameInput.trim(),
          parent_id: subcategoryParentInput,
          is_active: subcategoryActiveInput,
        })
        toast.success(`Subcategory "${subcategoryNameInput.trim()}" updated`)
      } else {
        await createPersonalCategory(userId, {
          name: subcategoryNameInput.trim(),
          parent_id: subcategoryParentInput,
          is_active: subcategoryActiveInput,
        })
        toast.success(`Subcategory "${subcategoryNameInput.trim()}" created`)
      }
      setSubcategoryModalOpen(false)
      await loadData()
      onSettingsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error(
        editingSubcategory ? "Failed to update subcategory" : "Failed to create subcategory"
      )
    } finally {
      setSavingSubcategory(false)
    }
  }

  // --------------------------------------------------------------------------
  // Payment Methods Handlers
  // --------------------------------------------------------------------------
  const handleAddPaymentMethod = async () => {
    const trimmed = newMethodInput.trim()
    if (!trimmed) {
      toast.error("Please enter payment method name")
      return
    }
    if (paymentMethods.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Payment method already exists")
      return
    }

    setSavingMethods(true)
    try {
      const updated = [...paymentMethods, trimmed]
      await updatePersonalExpenseSettings(userId, {
        custom_payment_methods: updated,
      })
      setPaymentMethods(updated)
      setNewMethodInput("")
      toast.success(`✓ Payment method "${trimmed}" added`)
      onSettingsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error("Failed to add payment method")
    } finally {
      setSavingMethods(false)
    }
  }

  const handleRemovePaymentMethod = async (method: string) => {
    if (paymentMethods.length <= 1) {
      toast.error("You must keep at least one payment method")
      return
    }

    setSavingMethods(true)
    try {
      const updated = paymentMethods.filter((m) => m !== method)
      const nextDefault =
        defaultPaymentMethod === method ? updated[0] || "Cash" : defaultPaymentMethod
      await updatePersonalExpenseSettings(userId, {
        custom_payment_methods: updated,
        default_payment_method: nextDefault,
      })
      setPaymentMethods(updated)
      setDefaultPaymentMethod(nextDefault)
      toast.success(`✓ Payment method "${method}" removed`)
      onSettingsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error("Failed to remove payment method")
    } finally {
      setSavingMethods(false)
    }
  }

  const handleSetDefaultPaymentMethod = async (method: string) => {
    try {
      await updatePersonalExpenseSettings(userId, {
        default_payment_method: method,
      })
      setDefaultPaymentMethod(method)
      toast.success(`✓ Default payment method set to "${method}"`)
      onSettingsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error("Failed to set default payment method")
    }
  }

  // --------------------------------------------------------------------------
  // Preferences Handlers
  // --------------------------------------------------------------------------
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPreferences(true)
    try {
      await updatePersonalExpenseSettings(userId, {
        expense_number_prefix: prefix.trim().toUpperCase() || "PE-",
        starting_number: Math.max(1, startNum),
        default_currency: defaultCurrency,
        default_payment_method: defaultPaymentMethod,
        default_category_id: defaultCategoryId || null,
      })
      toast.success("✓ Personal expense settings updated")
      await loadData()
      onSettingsUpdated?.()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update personal expense preferences")
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleDiscardPreferences = () => {
    if (!settings) return
    setPrefix(settings.expense_number_prefix || "PE-")
    setStartNum(settings.starting_number || 1)
    setDefaultCurrency(settings.default_currency || "INR")
    setDefaultPaymentMethod(settings.default_payment_method || "Cash")
    setDefaultCategoryId(settings.default_category_id || "")
    toast.info("Changes discarded")
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-xs font-medium">Loading personal expense settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!isModal && (
        <div className="border-b pb-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Personal Expenses
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage categories, subcategories, payment methods and personal expense preferences.
          </p>
        </div>
      )}

      {/* Navigation Tabs (SaaS Layout - Responsive) */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/60 overflow-x-auto">
        {[
          { id: "categories", label: "Categories", icon: Tag, count: rootCategories.length },
          { id: "subcategories", label: "Subcategories", icon: FolderTree, count: allSubcategories.length },
          { id: "payment_methods", label: "Payment Methods", icon: CreditCard, count: paymentMethods.length },
          { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "bg-card text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ==================================================================== */}
      {/* 1. CATEGORIES TAB */}
      {/* ==================================================================== */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-8 text-xs h-9 rounded-xl"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleOpenAddCategory}
              className="text-xs rounded-xl shadow-xs shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Category
            </Button>
          </div>

          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="py-2.5 px-4">Category Name</th>
                    <th className="py-2.5 px-4 text-center">Subcategories</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredRootCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        {categorySearch ? "No categories matching search" : "No categories found"}
                      </td>
                    </tr>
                  ) : (
                    filteredRootCategories.map((cat) => {
                      const subCount = cat.subcategories?.length || 0
                      return (
                        <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: cat.color || "#4f46e5" }}
                              />
                              <span className="font-semibold text-foreground text-xs sm:text-sm">
                                {cat.name}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant="secondary"
                              className="text-[11px] font-normal px-2 py-0.5 rounded-full"
                            >
                              {subCount} {subCount === 1 ? "subcategory" : "subcategories"}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={cat.is_active ? "default" : "outline"}
                              className={`text-[10px] font-semibold cursor-pointer ${
                                cat.is_active
                                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                                  : "text-muted-foreground bg-muted hover:bg-muted/80"
                              }`}
                              onClick={() => handleToggleCategoryActive(cat)}
                              title="Click to toggle status"
                            >
                              {cat.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditCategory(cat)}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                title="Edit Category"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCheckCategoryDelete(cat)}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                                title="Delete or Deactivate"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. SUBCATEGORIES TAB */}
      {/* ==================================================================== */}
      {activeTab === "subcategories" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search subcategories..."
                  value={subcategorySearch}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                  className="pl-8 text-xs h-9 rounded-xl"
                />
                {subcategorySearch && (
                  <button
                    type="button"
                    onClick={() => setSubcategorySearch("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter by Category dropdown (Names, never UUIDs) */}
              <Select
                value={subcategoryParentFilter}
                onValueChange={(val) => setSubcategoryParentFilter(val || "all")}
              >
                <SelectTrigger className="w-[170px] text-xs h-9 rounded-xl shrink-0">
                  <SelectValue placeholder="All Categories">
                    {(val) => {
                      if (!val || val === "all") return "All Categories"
                      const c = rootCategories.find((x) => x.id === val)
                      return c ? c.name : "All Categories"
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  <SelectItem value="all">All Categories</SelectItem>
                  {rootCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.color || "#4f46e5" }}
                        />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              onClick={handleOpenAddSubcategory}
              className="text-xs rounded-xl shadow-xs shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Subcategory
            </Button>
          </div>

          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="py-2.5 px-4">Subcategory</th>
                    <th className="py-2.5 px-4">Parent Category</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSubcategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        {subcategorySearch || subcategoryParentFilter !== "all"
                          ? "No subcategories matching criteria"
                          : "No subcategories found. Click '+ Add Subcategory' to create one."}
                      </td>
                    </tr>
                  ) : (
                    filteredSubcategories.map((sub) => (
                      <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground text-xs sm:text-sm">
                          {sub.name}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-muted/60 border border-border/60">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: (sub as any).parent_color || "#4f46e5" }}
                            />
                            <span className="text-foreground font-medium">
                              {(sub as any).parent_name}
                            </span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={sub.is_active ? "default" : "outline"}
                            className={`text-[10px] font-semibold cursor-pointer ${
                              sub.is_active
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                                : "text-muted-foreground bg-muted hover:bg-muted/80"
                            }`}
                            onClick={() => handleToggleCategoryActive(sub)}
                            title="Click to toggle status"
                          >
                            {sub.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditSubcategory(sub)}
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                              title="Edit Subcategory"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCheckCategoryDelete(sub)}
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                              title="Delete or Deactivate"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. PAYMENT METHODS TAB */}
      {/* ==================================================================== */}
      {activeTab === "payment_methods" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Configured Payment Methods</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Available payment options when recording personal expenses.
                </p>
              </div>

              <div className="flex items-center gap-2 max-w-sm w-full sm:w-auto">
                <Input
                  placeholder="e.g. Sodexo, Crypto, PayPal"
                  value={newMethodInput}
                  onChange={(e) => setNewMethodInput(e.target.value)}
                  className="text-xs h-9 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddPaymentMethod()
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddPaymentMethod}
                  disabled={savingMethods || !newMethodInput.trim()}
                  className="text-xs rounded-xl shadow-xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Method
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
              {paymentMethods.map((pm) => {
                const isDefault = defaultPaymentMethod === pm
                return (
                  <div
                    key={pm}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold text-xs text-foreground">{pm}</span>
                      {isDefault && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] font-semibold bg-primary/10 text-primary border-primary/20 px-1.5 py-0"
                        >
                          Default
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {!isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefaultPaymentMethod(pm)}
                          className="h-6 text-[10px] text-muted-foreground hover:text-primary px-2"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={paymentMethods.length <= 1}
                        onClick={() => handleRemovePaymentMethod(pm)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        title="Remove Method"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. PREFERENCES TAB */}
      {/* ==================================================================== */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSavePreferences} className="space-y-5">
          {/* Unsaved changes alert */}
          {isPreferencesDirty && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>You have unsaved changes. Remember to click &quot;Save Changes&quot;.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscardPreferences}
                  className="h-7 text-xs"
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingPreferences}
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Numbering Rules Card */}
            <div className="p-5 rounded-xl border border-border/80 bg-card space-y-4 shadow-xs">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Expense Numbering</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automated sequence generator for vouchers and exports.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Expense Number Prefix</Label>
                  <Input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="PE-"
                    className="text-xs font-mono font-bold"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Example: PE- generates PE-000001, PE-000002...
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Starting Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={startNum}
                    onChange={(e) => setStartNum(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-xs font-mono font-bold"
                  />
                </div>

                {/* Preview Box */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Preview Next Number:</span>
                  <span className="font-mono font-bold text-primary">
                    {prefix || "PE-"}
                    {String(Math.max(startNum, settings?.next_number || 1)).padStart(6, "0")}
                  </span>
                </div>
              </div>
            </div>

            {/* Currency & Defaults Card */}
            <div className="p-5 rounded-xl border border-border/80 bg-card space-y-4 shadow-xs">
              <div>
                <h3 className="text-sm font-semibold text-foreground">General Defaults</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pre-filled selections when creating a new expense.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Currency</Label>
                  <Select
                    value={defaultCurrency}
                    onValueChange={(val) => {
                      if (val) setDefaultCurrency(val)
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue>
                        {(val) => {
                          const cur = CURRENCIES.find((c) => c.code === val)
                          return cur ? cur.label : val || "INR"
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-[110]">
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Payment Method</Label>
                  <Select
                    value={defaultPaymentMethod}
                    onValueChange={(val) => {
                      if (val) setDefaultPaymentMethod(val)
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Method">
                        {(val) => val || "Select Method"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-[110]">
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm} value={pm}>
                          {pm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Category (Optional)</Label>
                  <Select
                    value={defaultCategoryId || "none"}
                    onValueChange={(val) => setDefaultCategoryId(val === "none" ? "" : val || "")}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="No default category">
                        {(val) => {
                          if (!val || val === "none") return "No default category"
                          const cat = rootCategories.find((c) => c.id === val)
                          return cat ? cat.name : "No default category"
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-[110]">
                      <SelectItem value="none">No default category</SelectItem>
                      {rootCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: c.color || "#4f46e5" }}
                            />
                            <span>{c.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {isPreferencesDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDiscardPreferences}
                className="text-xs rounded-xl"
              >
                Discard
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={savingPreferences || !isPreferencesDirty}
              className="text-xs rounded-xl shadow-xs"
            >
              {savingPreferences && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* MODALS */}
      {/* ==================================================================== */}

      {/* 1. Add / Edit Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-md z-[100]">
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {editingCategory ? "Edit Category" : "Add Personal Expense Category"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Top-level expense category for organizing your personal diary.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name-input" className="text-xs font-semibold">
                  Category Name *
                </Label>
                <Input
                  id="cat-name-input"
                  required
                  placeholder="e.g. Groceries, Fuel, Medical"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Color Theme</Label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {CATEGORY_COLORS.map((col) => {
                    const isSelected = categoryColorInput === col
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCategoryColorInput(col)}
                        className={`h-7 rounded-lg transition-transform flex items-center justify-center ${
                          isSelected ? "scale-110 ring-2 ring-foreground" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: col }}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <div>
                  <span className="font-semibold text-foreground">Status</span>
                  <p className="text-[11px] text-muted-foreground">
                    Inactive categories won&apos;t appear in new expense dropdowns.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={categoryActiveInput ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryActiveInput(!categoryActiveInput)}
                  className="text-xs h-7 rounded-lg"
                >
                  {categoryActiveInput ? "Active" : "Inactive"}
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCategoryModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingCategory || !categoryNameInput.trim()}
                className="text-xs rounded-xl shadow-xs"
              >
                {savingCategory && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {editingCategory ? "Save Changes" : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add / Edit Subcategory Modal */}
      <Dialog open={subcategoryModalOpen} onOpenChange={setSubcategoryModalOpen}>
        <DialogContent className="sm:max-w-md z-[100]">
          <form onSubmit={handleSaveSubcategory} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Child category attached directly to a parent category.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="subcat-name-input" className="text-xs font-semibold">
                  Subcategory Name *
                </Label>
                <Input
                  id="subcat-name-input"
                  required
                  placeholder="e.g. Restaurant, Taxi, Flight"
                  value={subcategoryNameInput}
                  onChange={(e) => setSubcategoryNameInput(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
              </div>

              {/* Parent Category Dropdown (Renders names, NEVER UUIDs) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Parent Category *</Label>
                <Select
                  value={subcategoryParentInput}
                  onValueChange={(val) => {
                    if (val) setSubcategoryParentInput(val)
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Parent Category">
                      {(val) => {
                        if (!val) return "Select Parent Category"
                        const c = rootCategories.find((x) => x.id === val)
                        return c ? c.name : "Select Parent Category"
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-[110] max-h-56">
                    {rootCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color || "#4f46e5" }}
                          />
                          <span>{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <div>
                  <span className="font-semibold text-foreground">Status</span>
                  <p className="text-[11px] text-muted-foreground">
                    Inactive subcategories are hidden from expense forms.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={subcategoryActiveInput ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSubcategoryActiveInput(!subcategoryActiveInput)}
                  className="text-xs h-7 rounded-lg"
                >
                  {subcategoryActiveInput ? "Active" : "Inactive"}
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSubcategoryModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingSubcategory || !subcategoryNameInput.trim() || !subcategoryParentInput}
                className="text-xs rounded-xl shadow-xs"
              >
                {savingSubcategory && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {editingSubcategory ? "Save Changes" : "Save Subcategory"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Delete vs Deactivate Safety Dialog */}
      <Dialog open={safetyDialogOpen} onOpenChange={setSafetyDialogOpen}>
        <DialogContent className="sm:max-w-md z-[100]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-4.5 w-4.5" />
              {itemToDelete?.isUsed ? "Category is in use" : `Delete "${itemToDelete?.item.name}"?`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              {itemToDelete?.isUsed ? (
                <>
                  This category is already used by existing personal expenses. Deleting it would orphan those records. You can <strong>deactivate</strong> it instead so it no longer appears for new entries while preserving historical data.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete &ldquo;{itemToDelete?.item.name}&rdquo;? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSafetyDialogOpen(false)
                setItemToDelete(null)
              }}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>

            {itemToDelete?.isUsed ? (
              <Button
                type="button"
                size="sm"
                disabled={deletingOrDeactivating}
                onClick={() => handleExecuteCategoryAction("deactivate")}
                className="text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                {deletingOrDeactivating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Deactivate Category
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deletingOrDeactivating}
                onClick={() => handleExecuteCategoryAction("delete")}
                className="text-xs rounded-xl"
              >
                {deletingOrDeactivating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Delete Permanently
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
