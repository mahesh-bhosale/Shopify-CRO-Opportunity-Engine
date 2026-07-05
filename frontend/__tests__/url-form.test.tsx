import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import UrlForm from "../app/components/UrlForm";

describe("UrlForm Component", () => {
  it("renders correctly with primary and competitor inputs", () => {
    const mockSubmit = jest.fn();
    render(<UrlForm onSubmit={mockSubmit} isLoading={false} />);
    
    expect(screen.getByLabelText(/Your Shopify Store URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Compare against competitor/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run Diagnostic Audit/i })).toBeInTheDocument();
  });

  it("shows validation error when primary URL is missing", () => {
    const mockSubmit = jest.fn();
    render(<UrlForm onSubmit={mockSubmit} isLoading={false} />);
    
    const submitBtn = screen.getByRole("button", { name: /Run Diagnostic Audit/i });
    fireEvent.click(submitBtn);
    
    expect(screen.getByText(/Please enter your Shopify store URL/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("submits the standardized primary and competitor URL on valid input", () => {
    const mockSubmit = jest.fn();
    render(<UrlForm onSubmit={mockSubmit} isLoading={false} />);
    
    const primaryInput = screen.getByLabelText(/Your Shopify Store URL/i);
    const competitorInput = screen.getByLabelText(/Compare against competitor/i);
    
    fireEvent.change(primaryInput, { target: { value: "allbirds.com" } });
    fireEvent.change(competitorInput, { target: { value: "gymshark.com" } });
    
    const submitBtn = screen.getByRole("button", { name: /Run Diagnostic Audit/i });
    fireEvent.click(submitBtn);
    
    expect(mockSubmit).toHaveBeenCalledWith("https://allbirds.com", "https://gymshark.com");
  });
});
