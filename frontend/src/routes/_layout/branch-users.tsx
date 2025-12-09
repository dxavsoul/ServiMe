import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import BranchUsersOverview from "../../components/BranchUsers/BranchUsersOverview"

const branchUsersSearchSchema = z.object({
  page: z.number().catch(1),
  branchId: z.string().optional(),
})

export const Route = createFileRoute("/_layout/branch-users")({
  validateSearch: branchUsersSearchSchema,
  component: BranchUsersOverviewPage,
})

function BranchUsersOverviewPage() {
  return <BranchUsersOverview />
}
