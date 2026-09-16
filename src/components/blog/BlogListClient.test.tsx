import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlogListClient from "./BlogListClient";

const items = [
  { category: "Desarrollo Web", node: <div key="a">Post A</div> },
  { category: "Ciberseguridad", node: <div key="b">Post B</div> },
  { category: "Desarrollo Web", node: <div key="c">Post C</div> },
];
const categories = ["Desarrollo Web", "Ciberseguridad"];

describe("BlogListClient", () => {
  it("shows every item under the default 'Todos' filter", () => {
    render(<BlogListClient items={items} categories={categories} />);
    expect(screen.getByText("Post A")).toBeInTheDocument();
    expect(screen.getByText("Post B")).toBeInTheDocument();
    expect(screen.getByText("Post C")).toBeInTheDocument();
  });

  it("filters to only the selected category", async () => {
    const user = userEvent.setup();
    render(<BlogListClient items={items} categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Ciberseguridad" }));

    expect(screen.getByText("Post B")).toBeInTheDocument();
    expect(screen.queryByText("Post A")).not.toBeInTheDocument();
    expect(screen.queryByText("Post C")).not.toBeInTheDocument();
  });

  it("returns to showing everything when 'Todos' is clicked again", async () => {
    const user = userEvent.setup();
    render(<BlogListClient items={items} categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Ciberseguridad" }));
    await user.click(screen.getByRole("button", { name: "Todos" }));

    expect(screen.getByText("Post A")).toBeInTheDocument();
    expect(screen.getByText("Post B")).toBeInTheDocument();
    expect(screen.getByText("Post C")).toBeInTheDocument();
  });

  it("shows an empty-state message when a category has no matches", async () => {
    const user = userEvent.setup();
    render(<BlogListClient items={[]} categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Desarrollo Web" }));

    expect(screen.getByText(/no hay artículos/i)).toBeInTheDocument();
  });
});
