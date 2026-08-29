import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navbar from "./Navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Navbar mobile menu", () => {
  it("starts closed: no full-screen menu, hamburger labeled to open", () => {
    render(<Navbar />);
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();
    // The overlay's own nav links (duplicated from the desktop menu) shouldn't be mounted yet.
    expect(screen.queryByRole("button", { name: "Cerrar menú" })).not.toBeInTheDocument();
  });

  it("opens the full-screen menu when the hamburger is tapped", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));

    expect(screen.getByRole("button", { name: "Cerrar menú" })).toBeInTheDocument();
  });

  it("closes the menu when the close button is tapped again", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "Cerrar menú" }));

    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();
  });

  it("closes the menu when a nav link inside it is clicked", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    // The overlay renders its own "Inicio" link distinct from the desktop one.
    const inicioLinks = screen.getAllByRole("link", { name: "Inicio" });
    await user.click(inicioLinks[inicioLinks.length - 1]);

    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();
  });

  it("links Blog straight to /blog with no login submenu", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));

    const blogLinks = screen.getAllByRole("link", { name: "Blog" });
    expect(blogLinks.length).toBeGreaterThan(0);
    blogLinks.forEach((l) => expect(l).toHaveAttribute("href", "/blog"));
    expect(screen.queryByRole("link", { name: "Portal de redacción" })).not.toBeInTheDocument();
  });
});
