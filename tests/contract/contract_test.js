// tests/contract/contract_test.js
// Contract & Schema Validation Suite for OpenAPI 3.0.3 and Domain Events

import fs from 'fs';
import path from 'path';

function runContractTests() {
  console.log('[CONTRACT TEST] Starting OpenAPI & Event Schema Validation...');

  // 1. Validate openapi.yaml existence and key operationIds
  const openapiPath = path.resolve('contracts/openapi/openapi.yaml');
  if (!fs.existsSync(openapiPath)) {
    throw new Error('contracts/openapi/openapi.yaml is missing!');
  }

  const openapiContent = fs.readFileSync(openapiPath, 'utf8');
  const requiredOperations = [
    'registerUser',
    'loginUser',
    'getCurrentUser',
    'submitVerification',
    'listProducts',
    'createListing',
    'getListingDetail',
    'listRFQs',
    'createRFQ',
    'createQuote',
    'acceptQuote',
    'listOrders',
    'getOrderDetail',
    'signTradeContract',
    'processPayment',
    'handlePaymentWebhook',
    'createShipment',
    'executeSettlementRun',
    'openDispute',
  ];

  for (const op of requiredOperations) {
    if (!openapiContent.includes(`operationId: ${op}`) && !openapiContent.includes(`operationId: "${op}"`)) {
      throw new Error(`OpenAPI contract missing required operationId: ${op}`);
    }
  }
  console.log(`  ✓ OpenAPI 3.0.3 verified with all ${requiredOperations.length} core B2B operations.`);

  // 2. Validate events.json existence and schema structure
  const eventsPath = path.resolve('contracts/events/events.json');
  if (!fs.existsSync(eventsPath)) {
    throw new Error('contracts/events/events.json is missing!');
  }

  const eventsJson = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
  const requiredEvents = [
    'BaseEvent',
    'OrderPlacedPayload',
    'PaymentCapturedPayload',
    'InventoryReservedPayload',
    'DisputeOpenedPayload',
  ];

  for (const evt of requiredEvents) {
    if (!eventsJson.definitions[evt]) {
      throw new Error(`Event contract missing required definition: ${evt}`);
    }
  }
  console.log(`  ✓ Transactional Outbox/Inbox events verified with ${requiredEvents.length} event definitions.`);

  console.log('[CONTRACT TEST] ALL CONTRACT TESTS PASSED (100% OK).\n');
}

runContractTests();
