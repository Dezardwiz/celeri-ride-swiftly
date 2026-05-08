import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DriverDocType =
  | "cnh_front"
  | "cnh_back"
  | "crlv"
  | "selfie_with_doc"
  | "moto_front"
  | "moto_plate";

export interface DriverDocument {
  id: string;
  driver_id: string;
  type: DriverDocType;
  file_path: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const REQUIRED_DOCS: { type: DriverDocType; label: string; description: string }[] = [
  { type: "cnh_front", label: "CNH (frente)", description: "Foto nítida da frente da CNH" },
  { type: "cnh_back", label: "CNH (verso)", description: "Foto nítida do verso da CNH" },
  { type: "crlv", label: "CRLV da moto", description: "Documento da moto" },
  { type: "selfie_with_doc", label: "Selfie com documento", description: "Você segurando a CNH ao lado do rosto" },
  { type: "moto_front", label: "Foto da moto (frente)", description: "Frente da moto que você usa" },
  { type: "moto_plate", label: "Foto da placa", description: "Placa da moto legível" },
];

export function useDriverDocuments(driverId?: string) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DriverDocType | null>(null);

  const fetchDocs = useCallback(async () => {
    if (!driverId) { setLoading(false); return; }
    const { data } = await supabase
      .from("driver_documents")
      .select("*")
      .eq("driver_id", driverId);
    setDocs((data ?? []) as any);
    setLoading(false);
  }, [driverId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const upload = useCallback(async (type: DriverDocType, file: File) => {
    if (!user || !driverId) throw new Error("Sem sessão");
    setUploading(type);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${type}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("driver-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      // upsert metadata
      const { error: dbErr } = await supabase
        .from("driver_documents")
        .upsert(
          { driver_id: driverId, type, file_path: path, status: "pending", rejection_reason: null },
          { onConflict: "driver_id,type" }
        );
      if (dbErr) throw dbErr;

      await fetchDocs();
    } finally {
      setUploading(null);
    }
  }, [user, driverId, fetchDocs]);

  const getSignedUrl = useCallback(async (path: string) => {
    const { data } = await supabase.storage
      .from("driver-documents")
      .createSignedUrl(path, 60 * 10);
    return data?.signedUrl ?? null;
  }, []);

  return { docs, loading, uploading, upload, getSignedUrl, refresh: fetchDocs };
}

export async function submitForReview(driverId: string) {
  return supabase
    .from("drivers")
    .update({ onboarding_status: "in_review" })
    .eq("id", driverId);
}