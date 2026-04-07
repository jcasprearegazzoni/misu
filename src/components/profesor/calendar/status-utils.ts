import type { CSSProperties } from "react";
import type { BookingStatus } from "./types";

type StatusVisualParams = {
  status: BookingStatus;
  isFinalized: boolean;
  financialPending: boolean;
};

type StatusVisualResult = {
  label: string;
  style: CSSProperties;
  badgeClass: string;
};

export function getStatusVisual({
  status,
  isFinalized,
  financialPending,
}: StatusVisualParams): StatusVisualResult {
  if (isFinalized) {
    if (financialPending) {
      return {
        label: "Finalizada (pendiente)",
        style: {
          borderColor: "var(--warning-border)",
          background: "var(--warning-bg)",
          color: "var(--warning)",
        },
        badgeClass:
          "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)]",
      };
    }

    return {
      label: "Finalizada (cobrada)",
      style: {
        borderColor: "var(--success-border)",
        background: "var(--success-bg)",
        color: "var(--success)",
      },
      badgeClass:
        "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]",
    };
  }

  if (status === "pendiente") {
    return {
      label: "Pendiente",
      style: {
        borderColor: "var(--warning-border)",
        background: "var(--warning-bg)",
        color: "var(--warning)",
      },
      badgeClass:
        "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)]",
    };
  }

  if (status === "confirmado") {
    return {
      label: "Confirmada",
      style: {
        borderColor: "var(--success-border)",
        background: "var(--success-bg)",
        color: "var(--success)",
      },
      badgeClass:
        "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]",
    };
  }

  return {
    label: "Cancelada",
    style: {
      borderColor: "var(--error-border)",
      background: "var(--error-bg)",
      color: "var(--error)",
    },
    badgeClass: "border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error)]",
  };
}
