import type { Metadata } from "next"
import EmployeesClient from "@/components/employees/EmployeesClient"

export const metadata: Metadata = {
  title: "Employees",
  description: "Manage employee accounts and permissions",
}

export default function EmployeesPage() {
  return <EmployeesClient />
}
