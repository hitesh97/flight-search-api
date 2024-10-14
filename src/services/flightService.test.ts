import {
  searchFlightsWithCache,
  searchFlightsFromDatabase,
  calculateCO2Emissions,
} from "./flightService";
import { Flight } from "../models/flight";
import * as redis from "redis";
import pool from "../config/database";

// Redis Mock client is giving me trouble and mocking doesnt seem to work
// its possible with Jest version or Redis version but essesntially this is the pattern
// or something to do with Jest's setup of the redis client module!
// path I would take to test the service code.

// Mock Redis client
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    get: jest.fn(),
    setEx: jest.fn(),
  })),
}));

// Mock pg Pool (PostgreSQL)
jest.mock("../config/database", () => ({
  query: jest.fn(),
}));

const redisClient = redis.createClient();

describe("Flight Service", () => {
  const mockFlights: Flight[] = [
    {
      id: 1,
      flightNumber: "UA123",
      airline: "United Airlines",
      departureTime: new Date("2024-10-10T10:00:00Z"),
      arrivalTime: new Date("2024-10-10T14:00:00Z"),
      price: 500,
      departureCity: "New York",
      destinationCity: "London",
      distance: 5567,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("searchFlightsWithCache", () => {
    it("should return cached flights if they exist", async () => {
      // Mock Redis get method to return cached flights

      // tried these various ways of mocking
      //method 1:
      (redisClient.get as jest.Mock).mockReturnValue(
        JSON.stringify(mockFlights)
      );

      // method 2:
      // (redisClient.get as jest.Mock).mockImplementation((key, cb) => {
      //   return cb(null, JSON.stringify(mockFlights));
      // });

      // method 3:
      // (redisClient.get as jest.Mock).mockImplementation((key, cb) => {
      //   return Promise.resolve(() => {
      //     return cb(null, JSON.stringify(mockFlights));
      //   });
      // });

      const flights = await searchFlightsWithCache(
        "New York",
        "London",
        "2024-10-10"
      );

      expect(redisClient.get).toHaveBeenCalledWith(
        "New York-London-2024-10-10",
        expect.any(Function)
      );
      expect(flights).toEqual(mockFlights);
    });

    it("should fetch flights from the database if no cache exists", async () => {
      // Mock Redis get method to return null (no cache)
      (redisClient.get as jest.Mock).mockImplementationOnce((key, cb) => {
        return Promise.resolve(null);
      });

      console.log(redisClient);
      // Mock database query to return flights
      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockFlights,
      });

      const flights = await searchFlightsWithCache(
        "New York",
        "London",
        "2024-10-10"
      );

      expect(redisClient.get).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM flights WHERE departure_city = $1 AND destination_city = $2 AND departure_time::date = $3`,
        ["New York", "London", "2024-10-10"]
      );
      expect(redisClient.setEx).toHaveBeenCalledWith(
        "New York-London-2024-10-10",
        3600,
        JSON.stringify(mockFlights)
      );
      expect(flights).toEqual(mockFlights);
    });
  });

  describe("calculateCO2Emissions", () => {
    it("should correctly calculate CO2 emissions based on flight distance", () => {
      const distance = 5567; // km
      const emissions = calculateCO2Emissions(distance);
      const expectedEmissions = distance * 0.115; // CO2 emission factor

      expect(emissions).toEqual(expectedEmissions);
    });
  });

  describe("searchFlightsFromDatabase", () => {
    it("should query the database and return flights", async () => {
      // Mock the database query
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockFlights,
      });

      const flights = await searchFlightsFromDatabase(
        "New York",
        "London",
        "2024-10-10"
      );

      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM flights WHERE departure_city = $1 AND destination_city = $2 AND departure_time::date = $3`,
        ["New York", "London", "2024-10-10"]
      );
      expect(flights).toEqual(mockFlights);
    });

    it("should throw an error if database query fails", async () => {
      // Mock the database query to throw an error
      (pool.query as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        searchFlightsFromDatabase("New York", "London", "2024-10-10")
      ).rejects.toThrow("Failed to search flights. Please try again later.");
    });
  });
});
