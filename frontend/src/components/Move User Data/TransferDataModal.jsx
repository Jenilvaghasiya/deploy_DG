"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User as UserIcon,
  ArrowRight,
  AlertTriangle,
  Shield,
  CheckCircle2,
  Loader2,
  Search,
  Database,
} from "lucide-react";
import debounce from "lodash.debounce";
import { MdNote } from "react-icons/md";
import { transferRevokedUserData } from "@/features/users/userService";

export default function DataTransferModal({
  sourceUser,
  targetUsers,
  dataMigrated,
  loadRevokedUsers,
}) {
  const [open, setOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filteredTargets, setFilteredTargets] = useState(targetUsers);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [confirmText, setConfirmText] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const confirmationPhrase = "CONFIRM";
  const isConfirmed = confirmText === confirmationPhrase;

  // Filter users based on search input
  const debouncedFilter = debounce((query) => {
    if (!query.trim()) return setFilteredTargets(targetUsers);
    setFilteredTargets(
      targetUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, 200);

  useEffect(() => {
    debouncedFilter(search);
    return () => debouncedFilter.cancel();
  }, [search, targetUsers]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredTargets]);

  const handleKeyDown = (e) => {
    if (!isDropdownOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredTargets.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev === 0 ? filteredTargets.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredTargets[highlightedIndex]) {
        selectUser(filteredTargets[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsDropdownOpen(false);
    }
  };

  const selectUser = (user) => {
    setSelectedTarget(user);
    setIsDropdownOpen(false);
    setSearch("");
  };

  const handleTransferData = async () => {
    if (!selectedTarget || !isConfirmed) return;

    setIsTransferring(true);
    setShowAnimation(true);

    try {
      const payload = {
        revokedUserId: sourceUser.id,
        destinationUserId: selectedTarget.id,
      };

      const res = await transferRevokedUserData(payload);

      if (res?.status === 200) {
        setTransferComplete(true);
        setTimeout(() => {
          loadRevokedUsers();
          setOpen(false);
          resetModal();
        }, 2000);
      }
    } catch (error) {
      console.error("Transfer failed:", error);
      setIsTransferring(false);
      setShowAnimation(false);
    }
  };

  const resetModal = () => {
    setSelectedTarget(null);
    setConfirmText("");
    setIsTransferring(false);
    setTransferComplete(false);
    setShowAnimation(false);
    setSearch("");
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetModal();
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideData {
          0% {
            transform: translateX(-40px);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(40px);
            opacity: 0;
          }
        }

        .data-packet {
          animation: slideData 1.5s ease-in-out infinite;
        }

        .data-packet-1 {
          animation-delay: 0s;
        }

        .data-packet-2 {
          animation-delay: 0.3s;
        }

        .data-packet-3 {
          animation-delay: 0.6s;
        }
      `}</style>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button
            disabled={dataMigrated}
            className={`border px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
              dataMigrated
                ? "cursor-not-allowed border-gray-300 text-gray-400"
                : "cursor-pointer border-pink-400 text-pink-400 hover:bg-pink-500 hover:text-white"
            }`}
          >
            <MdNote className="text-lg" /> Migrate Data
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-3xl p-0 text-gray-900 !rounded-xl border-gray-700">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-800">
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Transfer User Data
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6 space-y-6">
            {/* Warning Alert */}
            <Alert className="border border-yellow-700/40 text-yellow-300 rounded-lg bg-yellow-900/50">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                <strong className="text-yellow-400">Important:</strong> All data
                from{" "}
                <span className="font-semibold text-yellow-100">
                  {sourceUser?.name}
                </span>{" "}
                will be permanently transferred to the selected user. This
                action cannot be undone.
              </AlertDescription>
            </Alert>

            {/* User Transfer Visualization */}
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                {/* Source User */}
                <div
                  className={`flex-1 transition-transform duration-300 ${
                    showAnimation ? "scale-95" : "scale-100"
                  }`}
                >
                  <div className="p-6 border border-gray-700 rounded-xl backdrop-blur">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <UserIcon className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">✕</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-white text-lg">
                          {sourceUser?.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {sourceUser?.email}
                        </div>
                        <div className="mt-2 text-xs text-red-400 font-medium">
                          Revoked User
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated Arrow and Data Packets */}
                <div className="relative w-24 flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-gray-600" />

                  {/* Animated data packets */}
                  {showAnimation && !transferComplete && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="data-packet data-packet-1 absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                      <div className="data-packet data-packet-2 absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                      <div className="data-packet data-packet-3 absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                    </div>
                  )}
                </div>

                {/* Target User */}
                <div
                  className={`flex-1 transition-transform duration-300 ${
                    showAnimation ? "scale-105" : "scale-100"
                  }`}
                >
                  <div className="p-6 border border-gray-700 rounded-xl backdrop-blur">
                    {selectedTarget ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <UserIcon className="w-10 h-10 text-white" />
                          </div>
                          {transferComplete && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-white text-lg">
                            {selectedTarget.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {selectedTarget.email}
                          </div>
                          <div className="mt-2 text-xs text-green-400 font-medium">
                            Target User
                          </div>
                        </div>
                        {!isTransferring && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTarget(null)}
                            className="mt-2 text-xs"
                          >
                            Change User
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 h-full justify-center">
                        <div className="w-20 h-20 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center animate-pulse">
                          <UserIcon className="w-10 h-10 text-gray-600" />
                        </div>
                        <div className="relative w-full">
                          <Button
                            variant="outline"
                            onClick={() => setIsDropdownOpen(true)}
                            className="w-full"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Select Target User
                          </Button>

                          {isDropdownOpen && (
                            <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-700 shadow-xl animate-fade-in">
                              <div className="p-2">
                                <Input
                                  placeholder="Search users..."
                                  value={search}
                                  onChange={(e) => setSearch(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  className="mb-2"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto">
                                {filteredTargets.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    No users found
                                  </div>
                                ) : (
                                  filteredTargets.map((user, idx) => (
                                    <button
                                      key={user.id}
                                      className={`w-full px-4 py-3 text-left transition-colors ${
                                        idx === highlightedIndex
                                          ? "bg-gray-700"
                                          : "hover:bg-gray-700/50"
                                      }`}
                                      onClick={() => selectUser(user)}
                                      onMouseEnter={() =>
                                        setHighlightedIndex(idx)
                                      }
                                    >
                                      <div className="font-medium text-white">
                                        {user.name}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {user.email}
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Section */}
            {selectedTarget && !transferComplete && (
              <div className="space-y-4 p-4 rounded-lg border border-gray-700 animate-fade-in">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm text-gray-300">
                      To proceed with the data transfer, please type{" "}
                      <span className="font-mono bg-blue-900/50 px-2 py-1 rounded text-blue-300">
                        {confirmationPhrase}
                      </span>{" "}
                      below:
                    </p>
                    <Input
                      value={confirmText}
                      onChange={(e) =>
                        setConfirmText(e.target.value.toUpperCase())
                      }
                      placeholder={`Type ${confirmationPhrase} to enable transfer`}
                      className="font-mono text-yellow-300"
                      disabled={isTransferring}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {transferComplete && (
              <div className="p-4 border border-green-700/40 rounded-lg animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <p className="text-green-300">
                    Data transfer completed successfully!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransferData}
              disabled={
                !selectedTarget ||
                !isConfirmed ||
                isTransferring ||
                transferComplete
              }
              className={`min-w-[140px] ${
                isConfirmed &&
                selectedTarget &&
                !isTransferring &&
                !transferComplete
                  ? "bg-blue-600 hover:bg-blue-700"
                  : ""
              }`}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : transferComplete ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Transfer Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
