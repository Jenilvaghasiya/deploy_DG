import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const MODULE_NAMES = {
  ge_variation: "Image Variation",
  text_to_image: "Text to Image",
  combine_image: "Combine Image",
  size_chart: "Size Chart",
  sketch_to_image: "Sketch to Image",
  general: "General",
  moodboard: "Moodboard",
  project: "Project",
};

const TYPE_NAMES = {
  credit_consumed: "Credit Consumed",
  output_produced: "Output Produced",
  general_log: "General Log",
  image_status_updated: "Image Moved",
  image_uploaded: "Image Uploaded",
  image_deleted: "Image Deleted",
  image_downloaded: "Image Downloaded",
  moodboard_created: "Moodboard Created",
  moodboard_deleted: "Moodboard Created",
  moodboard_edited: "Moodboard Edit",
  moodboard_downloaded: "Moodboard Download",
  project_created: "Project Created",
  project_deleted: "Project Deleted",
  project_downloaded: "Project Downloaded",
  project_edited: "Project Edited",
  image_edited: "Image Edited",
  message_broadcast: "Message Broadcast",
  image_variation: "Image Variation",
  text_to_image: "Text to Image",
  combine_image: "Combine Image",
  size_chart: "Size Chart",
  sketch_to_image: "Sketch to Image",
  user_account_info_updated: "User Information Updated",
  user_password_updated: "User Password Updated",
  user_email_updated: "User Email Updated",
};

const IMAGE_STATUS = {
  saved: "Save for Later",
  finalized: "Finalize",
  uploaded: "Uploaded",
  generated: "Generated",
};

export default function ActivityTable({ paginatedData }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="border-b border-white/10 bg-black/20 backdrop-blur-sm border-white/10 text-white">
            <TableHead className="text-gray-300 font-medium p-4">Module</TableHead>
            <TableHead className="text-gray-300 font-medium p-4">Action</TableHead>
            <TableHead className="text-gray-300 font-medium p-4">Description</TableHead>
            <TableHead className="text-gray-300 font-medium p-4">User</TableHead>
            <TableHead className="text-gray-300 font-medium p-4">Tenant</TableHead>
            <TableHead className="text-gray-300 font-medium p-4">Log Time</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.map((row, index) => {
            const userName = row?.user_id?.full_name || "This user"
            let description = "No activity recorded."

            const parts = []

            if (row.creditsUsed > 0) {
              parts.push(
                `has consumed ${row.creditsUsed} credit${row.creditsUsed > 1 ? "s" : ""}`
              )
            }
            if (row.outputCount > 0) {
              parts.push(
                `produced ${row.outputCount} output${row.outputCount > 1 ? "s" : ""}`
              )
            }

            if (parts.length) {
              description = `${userName} ${parts.join(" and ")}.`
            } else if (
              row.type === "image_status_updated" &&
              row.metadata?.from &&
              row.metadata?.to
            ) {
              const fromStatus = IMAGE_STATUS[row.metadata.from] || row.metadata.from
              const toStatus = IMAGE_STATUS[row.metadata.to] || row.metadata.to
              const imageNames = row.metadata?.name ? ` '${row.metadata.name}'` : ""
              description = `${userName} moved image${imageNames} from '${fromStatus}' to '${toStatus}'.`
            } else if (row.type === "image_uploaded") {
              const uploadedNames = row.metadata?.name ? ` '${row.metadata.name}'` : ""
              description = `${userName} uploaded image(s)${uploadedNames}.`
            } else if (row.type === "image_deleted") {
              const deletedNames = row.metadata?.name ? ` '${row.metadata.name}'` : ""
              const status = row.metadata?.status
                ? ` from '${IMAGE_STATUS[row.metadata.status] || row.metadata.status}'`
                : ""
              description = `${userName} deleted image${deletedNames}${status}.`
            } else if (row.type === "image_edited") {
              const imageName = row.metadata?.name ? ` '${row.metadata.name}'` : ""
              description = `${userName} edited image${imageName}.`
            } else if (row.type === "moodboard_created") {
              description = `${userName} created a moodboard${
                row.metadata?.name ? ` '${row.metadata.name}'` : ""
              }.`
            } else if (row.type === "moodboard_edited") {
              description = `${userName} edited a moodboard${
                row.metadata?.name ? ` '${row.metadata.name}'` : ""
              }.`
            } else if (row.type === "moodboard_deleted") {
              description = `${userName} deleted a moodboard${
                row.metadata?.name ? ` '${row.metadata.name}'` : ""
              }.`
            } else if (row.type === "moodboard_downloaded") {
              description = `${userName} downloaded a moodboard${
                row.metadata?.name ? ` '${row.metadata.name}'` : ""
              }.`
            } else if (row.type === "project_created") {
              description = `${userName} created a project${
                row.metadata?.name ? ` '${row.metadata.name}'` : ""
              }.`
            } else if (row.type === "project_edited") {
              description = `${userName} edited a project${
                row.metadata?.name ? ` '${row.metadata.name}'` : ""
              }.`
            } else if (row.type === "project_deleted") {
              description = `${userName} deleted a project${
                row.metadata?.name ? ` '${row.metadata.name}'` : ""
              }.`
            } else if (row.type === "project_downloaded") {
              description = `${userName} downloaded a project${
                row.metadata?.name ? ` '${row.metadata.name}'` : ""
              }.`
            } else if (row.type === "project_linked") {
              const imageName = row.metadata?.imageName ? ` '${row.metadata.imageName}'` : ""
              const projectName = row.metadata?.projectName ? ` project '${row.metadata.projectName}'` : ""
              description = `${userName} linked${imageName} to${projectName}.`
            } else if (row.type === "message_broadcast") {
              const message = row.metadata?.message ? `: '${row.metadata.message}'` : ""
              description = `${userName} broadcasted a message${message}.`
            } else if (row.type === "user_account_info_updated") {
              description = `${userName} updated their Account Information.`
            } else if (row.type === "user_password_updated") {
              description = `${userName} updated their password.`
            } else if (row.type === "user_email_updated") {
              description = `${userName} changed their email from '${row.metadata?.oldEmail}' to '${row.metadata?.newEmail}'.`
            }

            return (
              <TableRow
                key={row._id || index}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <TableCell className="text-white/90 p-4">
                  {MODULE_NAMES[row.module] || row.module || "N/A"}
                </TableCell>
                <TableCell className="text-white/90 p-4">
                  {TYPE_NAMES[row.type] || row.type || "N/A"}
                </TableCell>
                <TableCell className="text-white/70 p-4">{description}</TableCell>
                <TableCell className="text-white/90 p-4 whitespace-nowrap">
                  {row?.user_id?.full_name || "N/A"}
                </TableCell>
                <TableCell className="text-white/90 p-4">
                  {row?.tenant_id?.name || "N/A"}
                </TableCell>
                <TableCell className="text-white/70 p-4 text-xs">
                  {new Date(row.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}