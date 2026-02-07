# Rental Webhook Service

This repository demonstrates the core idea and architecture of a webhook-based rental automation service.
Some parts of the original production system were removed or simplified for security and privacy reasons.

## What it does
- Receives order webhooks
- Checks availability with expiry times
- Generates passwords with a configurable prefix
- Forwards messages using a configurable sender

## Notes
- This is not a full production-ready system.
- Credentials, tokens and real integrations are intentionally omitted.
- The project focuses on showing the routing and automation logic.
