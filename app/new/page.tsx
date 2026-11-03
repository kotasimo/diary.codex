"use client";

import { Feather } from "lucide-react";

export default function NewPage() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <span className="brand">
            <span className="brand-mark">
              <Feather size={19} />
            </span>
            <span>Hibi</span>
          </span>
          <div className="header-actions">
            <span className="avatar avatar-me">K</span>
          </div>
        </div>
      </header>
      <main className="blank-main" />
    </div>
  );
}
