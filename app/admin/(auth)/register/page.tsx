import { Metadata } from "next"
import { RegisterForm } from "@/components/auth/RegisterForm"

export const metadata: Metadata = {
  title: "Register Company | Admin Portal",
  description: "Create a secure company workspace",
}

export default function AdminRegisterPage() {
  return (
    <RegisterForm
      loginHref="/admin/login"
      successRedirect="/admin"
      confirmationRedirect="/admin/login"
    />
  )
}
