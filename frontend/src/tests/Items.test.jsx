import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Items from "../pages/Items";
import { DataProvider } from "../state/DataContext";

jest.mock("react-window", () => ({
  FixedSizeList: ({ itemCount, children }) => (
    <div data-testid="virtual-list">
      {Array.from({ length: itemCount }).map((_, i) => {
        const child = children({ index: i, style: {} });
        return <div key={i}>{child}</div>;
      })}
    </div>
  ),
}));

const mockItemsResponse = {
  items: [
    { id: 1, name: "Alpha", price: 10 },
    { id: 2, name: "Beta", price: 20 },
  ],
  total: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

const mockStatsResponse = { total: 2, averagePrice: 15 };

describe("Items page", () => {
  beforeEach(() => {
    global.fetch = jest.fn((url, opts) => {
      const endpoint = typeof url === "string" ? url : url.url || "";
      if (
        endpoint.includes("/api/items") &&
        (!opts || !opts.method || opts.method === "GET")
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockItemsResponse),
        });
      }
      if (endpoint.includes("/api/stats")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatsResponse),
        });
      }
      // POST create item
      if (opts && opts.method === "POST" && endpoint.includes("/api/items")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ id: 3, name: "Gamma", price: 30, category: "" }),
        });
      }
      return Promise.reject(new Error("unhandled fetch " + endpoint));
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders items and stats", async () => {
    render(
      <MemoryRouter>
        <DataProvider>
          <Items />
        </DataProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
      expect(screen.getByText("Total items")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });
});
