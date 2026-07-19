'use strict';

/**
 * Client prompt definitions for Magnus Unified Reporting Engine.
 *
 * Each client entry maps a client_id to a function that receives a context
 * object and returns the full prompt string sent to the Anthropic API.
 */

const CLIENT_PROMPTS = {
  /**
   * Default / generic client — produces a structured markdown report.
   */
  default: (context) => `You are a professional business analyst.
Using the data context provided below, generate a concise executive summary report in Markdown.

## Context
${JSON.stringify(context, null, 2)}

## Requirements
- Use clear headings and bullet points.
- Highlight key metrics and trends.
- Keep the report under 600 words.
- End with a "Next Steps" section.`,

  /**
   * Financial reporting client.
   */
  finance: (context) => `You are a senior financial analyst preparing a board-level report.
Using the figures provided, produce a financial summary in Markdown.

## Financial Data
${JSON.stringify(context, null, 2)}

## Requirements
- Include a KPI table (Revenue, Costs, EBITDA, Net Profit).
- Comment on period-over-period variance.
- Flag any figures that deviate more than 10% from target.
- Add a brief risk commentary at the end.`,

  /**
   * Operations / SLA reporting client.
   */
  operations: (context) => `You are an operations manager summarising SLA performance.
Review the incident and uptime data below and produce a concise Markdown report.

## Operations Data
${JSON.stringify(context, null, 2)}

## Requirements
- Summarise uptime, incident count, and mean time to resolution (MTTR).
- List the top three recurring issues.
- Propose one preventative measure for each issue.`,
};

/**
 * Build the prompt for a given client.
 *
 * @param {string} clientId  - The client identifier (e.g. "finance").
 * @param {object} context   - Data context for the report.
 * @returns {string}          The prompt string.
 */
function buildClientPrompt(clientId, context) {
  const builder = CLIENT_PROMPTS[clientId] || CLIENT_PROMPTS.default;
  return builder(context);
}

module.exports = { buildClientPrompt, CLIENT_PROMPTS };
