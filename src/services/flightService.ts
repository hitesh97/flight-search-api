import * as redis from "redis";
import pool from "../config/database";
import { QueryResult } from "pg";
import { Flight } from "../models/flight";

const redisClient = redis.createClient();

// Method to search for flights from the database
export const searchFlightsFromDatabase = async (
  departureCity: string,
  destinationCity: string,
  date: string
) => {
  try {
    const query = `SELECT * FROM flights WHERE departure_city = $1 AND destination_city = $2 AND departure_time::date = $3`;
    const values = [departureCity, destinationCity, date];

    // Execute the query
    const result: QueryResult = await pool.query(query, values);

    // Return the flight results
    return result.rows;
  } catch (error) {
    //console.error("Error searching flights from the database:", error);
    throw new Error("Failed to search flights. Please try again later.");
  }
};

export const calculateCO2Emissions = (distance: number): number => {
  const emissionFactor = 0.115; // kg CO2 per km
  return distance * emissionFactor;
};

// Cached flight search function
export const searchFlightsWithCache = async (
  departureCity: string,
  destinationCity: string,
  date: string
): Promise<Flight[]> => {
  const cacheKey = `${departureCity}-${destinationCity}-${date}`;

  // console.log("----- redisClient here -----");
  // console.log(redisClient);
  // here I can see that redis client is a mocked object
  // and "get" method is also jest.fn!! however the mock
  // doesnt return required result!!

  // Check if the flights are already cached in Redis
  const cachedFlights = await redisClient.get(cacheKey);

  if (cachedFlights) {
    console.log("Returning cached flights");
    return JSON.parse(cachedFlights);
  }

  // If no cached data, fetch from the database
  const flights = await searchFlightsFromDatabase(
    departureCity,
    destinationCity,
    date
  );

  // Cache the flight results for future requests
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(flights));

  return flights;
};
