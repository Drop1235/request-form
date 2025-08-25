"use client";

import React from "react";

type Props = {
  label: string;
  confirmMessage: string;
  className?: string;
};

export default function ConfirmSubmitButton({ label, confirmMessage, className }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        if (confirm(confirmMessage)) {
          const form = (e.currentTarget as HTMLButtonElement).closest("form") as HTMLFormElement | null;
          form?.requestSubmit();
        }
      }}
    >
      {label}
    </button>
  );
}
