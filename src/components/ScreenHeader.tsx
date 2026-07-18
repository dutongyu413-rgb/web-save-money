import { CaretLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export function ScreenHeader({ title, backTo }: { title: string; backTo?: string }) {
  const navigate = useNavigate();
  return (
    <header className="screen-header">
      {backTo ? (
        <button className="icon-button" type="button" onClick={() => navigate(backTo)} aria-label="返回">
          <CaretLeft weight="bold" />
        </button>
      ) : <span className="header-slot" />}
      <h1>{title}</h1>
      <span className="header-slot" />
    </header>
  );
}
