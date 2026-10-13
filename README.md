# Syllabus Explainer

A full stack educational application designed to break down complex university lecture topics into clear and memorable explanations.

## Architecture Overview

The system utilizes a modern serverless pipeline for high availability and low latency.

1. Frontend Interface
Built with vanilla JavaScript and deployed on Vercel. Features a responsive UI and dynamic WebGL rendering using Three.js to provide spatial context to explanations.

2. Backend API
An Express server deployed on Vercel Serverless Functions. Handles prompt engineering, payload validation, and data routing.

3. AI Integration
Powered by the Groq API. The pipeline forces strict JSON schema generation to categorize topics into spatial dimensions for the rendering engine.

4. Distributed Caching
Integrates Upstash Redis as an in memory caching layer. Drastically reduces network latency and API usage by serving repeated queries instantly.

## Technical Highlights

+ Structured Data Pipelines
The backend bypasses flat text generation by forcing the LLM to output rigid JSON. This allows the frontend to dynamically mount specific WebGL geometries based on the spatial classification of the topic.

+ Memory Management
The Three.js rendering loop includes aggressive garbage collection and canvas disposal to prevent memory leaks during client sessions.

+ Serverless Optimization
Bypasses cold start latency issues and redundant API costs through a globally distributed Redis cache.

## Getting Started

To run this project locally you will need Node.js and API keys for Groq and Upstash Redis.

1. Clone the repository
2. Navigate to the backend directory
3. Create a .env file with your API credentials
4. Run npm install followed by npm run dev
5. Serve the frontend folder using a local web server

## Development Trajectory

This project serves as a foundational architecture bridge transitioning from standard web environments to spatial computing. Future development focuses entirely on C++ hardware integration and memory management for XR engines.