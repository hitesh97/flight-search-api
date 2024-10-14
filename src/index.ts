import express from "express";
import { graphqlHTTP } from "express-graphql";
import { makeExecutableSchema } from "graphql-tools";
import flightSchema from "./schema/flightSchema";
import flightResolver from "./resolvers/flightResolver";
import dotenv from "dotenv";

// Initialize environment variables
dotenv.config();

// Create executable GraphQL schema with graphql-tools
const schema = makeExecutableSchema({
  typeDefs: flightSchema,
  resolvers: flightResolver,
});

const app = express();

// Set up the GraphQL endpoint
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true, // Enable GraphiQL interface for testing
  })
);

// Start the Express server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/graphql`);
});
