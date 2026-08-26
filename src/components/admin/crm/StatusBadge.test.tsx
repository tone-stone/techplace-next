import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the Spanish label for a known status", () => {
    render(<StatusBadge status="activo" />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it.each([
    ["lead", "Lead"],
    ["negociacion", "En negociación"],
    ["inactivo", "Inactivo"],
    ["planeacion", "Planeación"],
    ["en_progreso", "En progreso"],
    ["revision", "En revisión"],
    ["completado", "Completado"],
    ["borrador", "Borrador"],
    ["enviada", "Enviada"],
    ["pagada", "Pagada"],
    ["vencida", "Vencida"],
  ])("maps status %s to label %s", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("falls back to the raw value for an unknown status instead of crashing", () => {
    render(<StatusBadge status="algo-nuevo" />);
    expect(screen.getByText("algo-nuevo")).toBeInTheDocument();
  });
});
