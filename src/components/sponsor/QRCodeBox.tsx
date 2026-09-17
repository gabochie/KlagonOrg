"use client";

import { QRCodeSVG } from "qrcode.react";

export function QRCodeBox({ value, size = 160 }: { value: string; size?: number }) {
  return (
    <div className="inline-block bg-white rounded-xl border border-border p-4">
      <QRCodeSVG value={value} size={size} fgColor="#0F1B5C" level="M" />
    </div>
  );
}