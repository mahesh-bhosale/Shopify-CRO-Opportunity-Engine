import axios from "axios";
import { runAudit, getExperimentBrief } from "../lib/api";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("API Client Library", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sends audit post request and returns response successfully", async () => {
    const mockResponse = {
      data: {
        store_url: "https://test.com",
        scraped_pages: ["https://test.com"],
        opportunities: [],
        summary: "Audit completed",
        generated_at: "2026-07-05T12:00:00Z",
      },
    };

    mockedAxios.create.mockReturnValue({
      post: jest.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await runAudit("https://test.com", "https://competitor.com");
    expect(result.store_url).toBe("https://test.com");
    expect(result.summary).toBe("Audit completed");
  });

  it("handles FastAPI validation array errors elegantly", async () => {
    const mockError = {
      response: {
        data: {
          detail: [{ loc: ["body", "url"], msg: "URL is invalid", type: "value_error" }],
        },
      },
    };

    mockedAxios.create.mockReturnValue({
      post: jest.fn().mockRejectedValue(mockError),
    } as any);

    await expect(runAudit("invalid")).rejects.toThrow("URL is invalid");
  });
});
