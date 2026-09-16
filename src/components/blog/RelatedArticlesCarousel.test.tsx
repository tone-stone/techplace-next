import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RelatedArticlesCarousel from "./RelatedArticlesCarousel";

const items = [
  { slug: "a", category: "Ciberseguridad", authorName: "Ana", node: <div key="a">Post A</div> },
  { slug: "b", category: "Desarrollo Web", authorName: "Ana", node: <div key="b">Post B</div> },
  { slug: "c", category: "Ciberseguridad", authorName: "Beto", node: <div key="c">Post C</div> },
];

describe("RelatedArticlesCarousel", () => {
  it("shows every item under 'Todos'", () => {
    render(<RelatedArticlesCarousel items={items} currentCategory="Ciberseguridad" currentAuthor="Ana" />);
    expect(screen.getByText("Post A")).toBeInTheDocument();
    expect(screen.getByText("Post B")).toBeInTheDocument();
    expect(screen.getByText("Post C")).toBeInTheDocument();
  });

  it("'Noticias parecidas' filters to the current article's category", async () => {
    const user = userEvent.setup();
    render(<RelatedArticlesCarousel items={items} currentCategory="Ciberseguridad" currentAuthor="Ana" />);

    await user.click(screen.getByRole("button", { name: "Noticias parecidas" }));

    expect(screen.getByText("Post A")).toBeInTheDocument();
    expect(screen.getByText("Post C")).toBeInTheDocument();
    expect(screen.queryByText("Post B")).not.toBeInTheDocument();
  });

  it("'Mismo redactor' filters to the current article's author", async () => {
    const user = userEvent.setup();
    render(<RelatedArticlesCarousel items={items} currentCategory="Ciberseguridad" currentAuthor="Ana" />);

    await user.click(screen.getByRole("button", { name: "Mismo redactor" }));

    expect(screen.getByText("Post A")).toBeInTheDocument();
    expect(screen.getByText("Post B")).toBeInTheDocument();
    expect(screen.queryByText("Post C")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when no items are provided", () => {
    render(<RelatedArticlesCarousel items={[]} currentCategory="Ciberseguridad" currentAuthor="Ana" />);
    expect(screen.getByText(/no hay artículos/i)).toBeInTheDocument();
  });
});
