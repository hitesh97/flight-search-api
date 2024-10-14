import { gql } from "apollo-server-express";

const typeDefs = gql`
  type Flight {
    id: ID!
    flightNumber: String!
    airline: String!
    departureTime: String!
    arrivalTime: String!
    price: Float!
    departureCity: String!
    destinationCity: String!
    co2Emissions: Float!
  }

  type Query {
    searchFlights(
      departureCity: String!
      destinationCity: String!
      date: String!
    ): [Flight]
  }
`;

export default typeDefs;
