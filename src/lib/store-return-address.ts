export type StoreReturnAddress = {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export const DEFAULT_STORE_RETURN_ADDRESS: StoreReturnAddress = {
  name: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Australia",
};

export function mergeStoreReturnAddress(
  input?: Partial<StoreReturnAddress> | null,
): StoreReturnAddress {
  return {
    name: String(input?.name ?? "").trim(),
    address: String(input?.address ?? "").trim(),
    city: String(input?.city ?? "").trim(),
    state: String(input?.state ?? "").trim(),
    postalCode: String(input?.postalCode ?? "").trim(),
    country: String(input?.country ?? DEFAULT_STORE_RETURN_ADDRESS.country).trim() || "Australia",
  };
}
