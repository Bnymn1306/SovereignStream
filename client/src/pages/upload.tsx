import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/components/wallet-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload as UploadIcon, Wallet, Loader2, FileVideo, FileText, X, CheckCircle2, ExternalLink, Clock, ShieldCheck } from "lucide-react";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  contentType: z.enum(["video", "pdf"]),
  priceShelbyUsd: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Price must be greater than 0"),
  displayName: z.string().min(1, "Creator name is required").max(50),
});

type UploadFormData = z.infer<typeof uploadSchema>;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const { connected, address, connect, signMessage } = useWallet();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<{
    shelbyBlobId: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    storedFilename?: string;
    shelbyUpload?: boolean;
    shelbyRegistered?: boolean;
    shelbyIsWritten?: boolean;
    shelbyExplorerUrl?: string;
    shelbyAccount?: string;
    shelbyError?: string;
    uploadMs?: number;
  } | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isOnShelby = uploadedFileData?.shelbyUpload || uploadedFileData?.shelbyRegistered;
    if (!isOnShelby || uploadedFileData?.shelbyIsWritten) return;
    const blobId = uploadedFileData?.shelbyBlobId ?? "";
    if (!blobId.startsWith("files/")) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/blob-status?blobName=${encodeURIComponent(blobId)}`);
        if (!res.ok) return;
        const status = await res.json();
        if (status.isWritten) {
          setUploadedFileData((prev) => prev ? { ...prev, shelbyIsWritten: true } : prev);
          clearInterval(interval);
        } else if (status.registered && !uploadedFileData?.shelbyRegistered) {
          setUploadedFileData((prev) => prev ? { ...prev, shelbyRegistered: true } : prev);
        }
      } catch { }
    };

    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [uploadedFileData?.shelbyBlobId, uploadedFileData?.shelbyUpload, uploadedFileData?.shelbyRegistered, uploadedFileData?.shelbyIsWritten]);

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      contentType: "video",
      priceShelbyUsd: "0.1",
      displayName: "",
    },
  });

  const selectedType = form.watch("contentType");

  const acceptedTypes = selectedType === "pdf"
    ? ".pdf"
    : ".mp4,.webm,.mov,.avi,.mkv";

  const handleFileSelect = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const videoExts = ["mp4", "webm", "mov", "avi", "mkv"];
    const pdfExts = ["pdf"];

    if (selectedType === "video" && !videoExts.includes(ext)) {
      toast({ title: "Wrong file type", description: "Please select a video file (.mp4, .webm, .mov, .avi, .mkv)", variant: "destructive" });
      return;
    }
    if (selectedType === "pdf" && !pdfExts.includes(ext)) {
      toast({ title: "Wrong file type", description: "Please select a PDF file.", variant: "destructive" });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 100 MB.", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    setUploadedFileData(null);
    setFileUploading(true);

    try {
      const uploadStart = performance.now();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(errData.message);
      }

      const data = await res.json();
      const uploadMs = Math.round(performance.now() - uploadStart);
      setUploadedFileData({ ...data, uploadMs });
      if (data.shelbyUpload) {
        if (data.shelbyIsWritten) {
          toast({ title: "Uploaded to ShelbyNet", description: `Blob is live on Shelby network (isWritten: true). Visible in Explorer.` });
        } else {
          toast({ title: "Uploaded to ShelbyNet", description: `File stored on Shelby RPC in ${uploadMs}ms. Will appear in Explorer once storage providers confirm (isWritten: true).` });
        }
      } else if (data.shelbyRegistered) {
        toast({ title: "File uploaded", description: "Blob registered on-chain. RPC storage temporarily unavailable — file stored locally as backup." });
      } else {
        toast({ title: "File uploaded", description: data.shelbyError || `Stored locally in ${uploadMs}ms`, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "File upload failed", description: err.message, variant: "destructive" });
      setSelectedFile(null);
    } finally {
      setFileUploading(false);
    }
  }, [selectedType, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadedFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      setUploading(true);

      if (!uploadedFileData) {
        throw new Error("Please upload a file before publishing.");
      }

      const nonce = Date.now().toString();
      const messageText = `SovereignStream Content Publishing\n\nTitle: ${data.title}\nPrice: ${data.priceShelbyUsd} ShelbyUSD\nBlob: ${uploadedFileData.shelbyBlobId}\nNonce: ${nonce}`;

      toast({ title: "Wallet Approval Required", description: "Please sign the message in your wallet to publish content." });

      try {
        await signMessage({ message: messageText, nonce });
      } catch (err: any) {
        if (err?.message?.includes("rejected") || err?.message?.includes("cancelled") || err?.message?.includes("denied")) {
          throw new Error("Wallet signature rejected. Content was not published.");
        }
        throw new Error("Wallet signature failed: " + (err?.message || "Unknown error"));
      }

      const shelbyBlobId = uploadedFileData.shelbyBlobId;
      const localFilename = uploadedFileData.storedFilename || null;

      const res = await apiRequest("POST", "/api/contents", {
        ...data,
        walletAddress: address,
        shelbyBlobId,
        localFilename,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Content published!", description: "Your content is now live on the marketplace." });
      queryClient.invalidateQueries({ queryKey: ["/api/contents"] });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  if (!connected) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold" data-testid="text-connect-prompt">Connect to Upload</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connect your wallet to upload content to Shelby Protocol and set pricing.
          </p>
          <button
            onClick={connect}
            data-testid="button-connect-wallet"
            className="gradient-primary text-white px-6 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-upload-title">Upload Content</h1>
          <p className="text-sm text-muted-foreground">
            Publish your content to the Shelby Protocol and set your price in ShelbyUSD.
          </p>
        </div>

        <div className="glass-card rounded-lg p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => uploadMutation.mutate(data))}
              className="space-y-5"
              data-testid="form-upload"
            >
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creator Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} data-testid="input-creator-name" className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Content title" {...field} data-testid="input-title" className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your content..."
                        className="resize-none bg-background/50"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        clearFile();
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-content-type" className="bg-background/50">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="video">
                          <span className="flex items-center gap-2">
                            <FileVideo className="w-4 h-4" />
                            Video
                          </span>
                        </SelectItem>
                        <SelectItem value="pdf">
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            PDF Document
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                  dragOver
                    ? "border-primary bg-primary/10"
                    : uploadedFileData
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/8"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !fileUploading && fileInputRef.current?.click()}
                data-testid="dropzone-file"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedTypes}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  data-testid="input-file"
                />

                {fileUploading ? (
                  <div className="space-y-2">
                    <Loader2 className="w-10 h-10 text-primary/60 mx-auto animate-spin" />
                    <p className="text-sm text-foreground font-medium">Uploading to Shelby Protocol...</p>
                    <p className="text-xs text-muted-foreground">Fragmenting with Clay Codes</p>
                  </div>
                ) : uploadedFileData ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="text-sm text-foreground font-medium">{uploadedFileData.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFileData.fileSize)} — {uploadedFileData.shelbyUpload ? "Stored on ShelbyNet" : uploadedFileData.shelbyRegistered ? "Registered on-chain, stored locally" : "Stored locally"}
                    </p>
                    {uploadedFileData.uploadMs && (
                      <p className="text-[10px] font-mono text-emerald-400/80" data-testid="text-upload-time">
                        Uploaded in {uploadedFileData.uploadMs}ms via Shelby
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 font-mono truncate max-w-xs mx-auto">
                      {uploadedFileData.shelbyBlobId}
                    </p>

                    {(uploadedFileData.shelbyUpload || uploadedFileData.shelbyRegistered) && (
                      <div className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full ${
                        uploadedFileData.shelbyIsWritten
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {uploadedFileData.shelbyIsWritten
                          ? <><ShieldCheck className="w-3 h-3" /> isWritten: true — Confirmed in Explorer</>
                          : <><Clock className="w-3 h-3 animate-pulse" /> isWritten: false — Awaiting indexer confirmation</>
                        }
                      </div>
                    )}

                    {!uploadedFileData.shelbyIsWritten && uploadedFileData.shelbyUpload && (
                      <p className="text-[10px] text-muted-foreground/70 text-center max-w-xs mx-auto leading-relaxed">
                        File is on Shelby RPC. Storage providers will confirm shortly — Explorer will list it when <span className="font-mono text-amber-400">isWritten</span> becomes <span className="font-mono text-emerald-400">true</span> on-chain.
                      </p>
                    )}

                    {!uploadedFileData.shelbyIsWritten && uploadedFileData.shelbyRegistered && !uploadedFileData.shelbyUpload && (
                      <p className="text-[10px] text-muted-foreground/70 text-center max-w-xs mx-auto leading-relaxed">
                        Blob metadata is on-chain. Explorer indexes new blobs within a few minutes — refresh Explorer to see <span className="font-mono text-amber-400">{uploadedFileData.shelbyBlobId}</span>.
                      </p>
                    )}

                    {(uploadedFileData.shelbyUpload || uploadedFileData.shelbyRegistered) && uploadedFileData.shelbyExplorerUrl && (
                      <a
                        href={uploadedFileData.shelbyExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="link-shelby-explorer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on Shelby Explorer
                      </a>
                    )}
                    {uploadedFileData.shelbyError && (
                      <p className="text-[10px] text-amber-400/70 font-mono" data-testid="text-shelby-error">
                        {uploadedFileData.shelbyError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors mt-1"
                      data-testid="button-remove-file"
                    >
                      <X className="w-3 h-3" />
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedType === "video" ? (
                      <FileVideo className="w-10 h-10 text-primary/40 mx-auto" />
                    ) : (
                      <FileText className="w-10 h-10 text-primary/40 mx-auto" />
                    )}
                    <p className="text-sm text-foreground font-medium">
                      {dragOver ? "Drop your file here" : "Click or drag to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedType === "video"
                        ? "MP4, WebM, MOV, AVI, MKV — up to 100 MB"
                        : "PDF — up to 100 MB"}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      File will be fragmented and stored on Shelby Protocol
                    </p>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="priceShelbyUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (ShelbyUSD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.1"
                        {...field}
                        data-testid="input-price"
                        className="bg-background/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                className="w-full gradient-primary text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 cursor-pointer"
                disabled={uploading || uploadMutation.isPending || !uploadedFileData}
                data-testid="button-submit-upload"
              >
                {uploading || uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing to Shelby Protocol...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    Publish Content
                  </>
                )}
              </button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
