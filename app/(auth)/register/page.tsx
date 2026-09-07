import { Metadata } from "next"
import { RegisterForm } from "@/components/auth/RegisterForm"

export const metadata: Metadata = {
  title: "Register Company | Textile Challan Management",
  description: "Create a secure company workspace",
}

export default function RegisterPage() {
  return (
    <RegisterForm
      loginHref="/login"
      successRedirect="/"
      confirmationRedirect="/login"
    />
  )
}
