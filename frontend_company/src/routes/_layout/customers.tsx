import { createFileRoute } from "@tanstack/react-router"

import { CustomerManagement } from "@/components/Customers"

export const Route = createFileRoute("/_layout/customers")({
  component: Customers,
})

function Customers() {
  return <CustomerManagement />
}
