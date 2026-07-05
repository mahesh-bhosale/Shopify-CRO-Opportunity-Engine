import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoadingState from "../app/components/LoadingState";

describe("LoadingState Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders correctly and starts cycling loading messages", () => {
    render(<LoadingState />);
    
    expect(screen.getByText(/Analyzing Store CRO/i)).toBeInTheDocument();
    expect(screen.getByText(/Initializing store crawler/i)).toBeInTheDocument();

    // Advance timers to trigger message cycle
    act(() => {
      jest.advanceTimersByTime(2800);
    });

    expect(screen.getByText(/Scraping Shopify store collections & pages/i)).toBeInTheDocument();
  });
});
