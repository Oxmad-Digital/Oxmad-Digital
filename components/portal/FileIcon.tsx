import { File, FileArchive, FileImage, FileSpreadsheet, FileText, FileVideo } from "lucide-react";

export default function FileIcon({ name, type }: { name: string; type: string | null }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const Icon = type?.startsWith("image/") ? FileImage
    : type?.startsWith("video/") ? FileVideo
    : ["zip", "rar", "7z", "gz"].includes(ext) ? FileArchive
    : ["xls", "xlsx", "csv", "ods"].includes(ext) ? FileSpreadsheet
    : ["pdf", "doc", "docx", "txt", "md", "odt"].includes(ext) ? FileText
    : File;
  return <Icon size={18} aria-hidden="true" />;
}
