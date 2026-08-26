import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostGallery from "./PostGallery";

const urls = ["https://example.com/1.webp", "https://example.com/2.webp", "https://example.com/3.webp"];

describe("PostGallery", () => {
  it("renders one thumbnail button per photo and no lightbox yet", () => {
    render(<PostGallery urls={urls} />);
    expect(screen.getAllByRole("button", { name: "Ver foto en grande" })).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
  });

  it("opens the lightbox when a thumbnail is clicked", async () => {
    const user = userEvent.setup();
    render(<PostGallery urls={urls} />);

    await user.click(screen.getAllByRole("button", { name: "Ver foto en grande" })[0]);

    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });

  it("closes the lightbox on Escape", async () => {
    const user = userEvent.setup();
    render(<PostGallery urls={urls} />);

    await user.click(screen.getAllByRole("button", { name: "Ver foto en grande" })[0]);
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
  });

  it("closes the lightbox when clicking the close button", async () => {
    const user = userEvent.setup();
    render(<PostGallery urls={urls} />);

    await user.click(screen.getAllByRole("button", { name: "Ver foto en grande" })[0]);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
  });

  it("shows prev/next controls only when there is more than one photo", async () => {
    const user = userEvent.setup();
    render(<PostGallery urls={["https://example.com/only.webp"]} />);

    await user.click(screen.getByRole("button", { name: "Ver foto en grande" }));

    expect(screen.queryByRole("button", { name: "Foto siguiente" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Foto anterior" })).not.toBeInTheDocument();
  });

  it("wraps around to the first photo after 'next' from the last one", async () => {
    const user = userEvent.setup();
    const { container } = render(<PostGallery urls={urls} />);

    await user.click(screen.getAllByRole("button", { name: "Ver foto en grande" })[2]);
    await user.click(screen.getByRole("button", { name: "Foto siguiente" }));

    // The lightbox's enlarged <img> is the only one directly inside the fixed
    // overlay; it should now point back at the first photo (index 0).
    const enlarged = container.querySelector(".fixed img");
    expect(enlarged?.getAttribute("src")).toContain("1.webp");
  });
});
