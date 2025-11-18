import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const IpAddressPopup = ({data}) => {
  const [search, setSearch] = useState("");
const cleanIp = (ip) => ip.replace(/^::ffff:/, "").replace(/^::/, "");
  // Show preview (first 2 IPs)
  const previewCount = 1;
  const previewIps = data.slice(0, previewCount);

  // Filtered IPs in modal
  const filteredIps = data
    .map(cleanIp)
    .filter((ip) =>
    ip.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog>
      {/* Preview in parent */}
      <div className="flex items-center gap-2">
        {previewIps.map((ip) => (
          <span key={ip} className="text-sm">
            {ip}
          </span>
        ))}

        {data.length > previewCount && (
          <DialogTrigger asChild>
            <button className="text-zinc-400 text-sm underline cursor-pointer">
              Show more
            </button>
          </DialogTrigger>
        )}
      </div>

      {/* Modal content */}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Allowed IP Addresses</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <Input
          placeholder="Search IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 text-white"
        />

        {/* Table */}
        <div className="max-h-60 overflow-y-auto border rounded-md custom-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIps.length > 0 ? (
                filteredIps.map((ip, index) => (
                  <TableRow key={ip}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{ip}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-gray-500">
                    No IPs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
