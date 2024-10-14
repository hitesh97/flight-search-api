import { Flight } from "../models/flight";
import { searchFlightsWithCache } from "../services/flightService";
import { calculateCO2Emissions } from "../services/flightService";

const flightResolver = {
  Query: {
    searchFlights: async (_: any, args: any): Promise<Flight[]> => {
      const { departureCity, destinationCity, date } = args;

      // Use the cached flight search function
      const flights: Flight[] = await searchFlightsWithCache(
        departureCity,
        destinationCity,
        date
      );

      // Map over the results to include CO2 emissions for each flight
      return flights.map((flight) => ({
        ...flight,
        co2Emissions: calculateCO2Emissions(flight.distance),
      }));
    },
  },
};

export default flightResolver;
