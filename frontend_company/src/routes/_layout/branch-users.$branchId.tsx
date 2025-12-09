import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import BranchUsers from "../../components/BranchUsers/BranchUsers"

const branchUserSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/branch-users/$branchId")({
  validateSearch: branchUserSearchSchema,
  component: BranchUserManagementPage,
})

function BranchUserManagementPage() {
  const { branchId } = Route.useParams()
  
  return <BranchUsers branchId={branchId} />
}
