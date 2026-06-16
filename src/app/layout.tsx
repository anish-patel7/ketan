import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import PasswordGate from "@/components/PasswordGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIMS — BA/BE Laboratory Management",
  description: "Bioanalytical Laboratory Information Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <AntdRegistry>
          <PasswordGate>{children}</PasswordGate>
        </AntdRegistry>
      </body>
    </html>
  );
}
