/// <reference types="cypress" />

// Cypress will ignore unexpected frontend exceptions to keep the flow stable.
Cypress.on('uncaught:exception', () => false);
