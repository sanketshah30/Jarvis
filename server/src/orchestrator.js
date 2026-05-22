import { loadJsonConfig, loadPrompt } from "./config.js";
import { createAnthropicClient, runAgent } from "./anthropicClient.js";
import { executeActions } from "./actionExecutor.js";
import {
  extractActions,
  extractSummary,
  STRUCTURED_RESPONSE_INSTRUCTION
} from "./structuredOutput.js";

function pickExecutives(mission, routingRules) {
  const lcMission = mission.toLowerCase();
  const matched = routingRules.routing
    .filter((rule) => rule.keywords.some((k) => lcMission.includes(k.toLowerCase())))
    .map((rule) => rule.agent);

  const isBroadBuildMission =
    /(build|launch|create|start|plan)/i.test(lcMission) &&
    /(company|platform|business|product|startup)/i.test(lcMission);

  if (isBroadBuildMission) {
    return routingRules.routing.map((rule) => rule.agent);
  }

  if (matched.length === 0 && routingRules.default_behavior.route_all_executives_if_unclear) {
    return routingRules.routing.map((rule) => rule.agent);
  }
  return [...new Set(matched)];
}

function getById(items, id) {
  return items.find((item) => item.id === id);
}

export async function getOrganization() {
  const agentsConfig = await loadJsonConfig("config/agents.json");
  return agentsConfig;
}

export async function executeMissionStreaming(
  mission,
  onEvent = () => {},
  previousCeoAggregate = "",
  shouldCancel = () => false
) {
  const toStructuredPrompt = (basePrompt) =>
    `${basePrompt}\n\n${STRUCTURED_RESPONSE_INSTRUCTION}`;

  async function runStructuredAgent({ label, system, prompt, actionContext }) {
    const rawOutput = await runAgent({
      client,
      system: toStructuredPrompt(system),
      prompt,
      label
    });
    const actions = extractActions(rawOutput);
    const actionResults = await executeActions(actions, actionContext);
    return {
      summary: extractSummary(rawOutput),
      actions,
      actionResults
    };
  }

  const throwIfCancelled = () => {
    if (shouldCancel()) {
      throw new Error("MISSION_CANCELLED");
    }
  };

  throwIfCancelled();
  const startedAt = Date.now();
  console.log(`[jarvis] mission received: ${mission.slice(0, 120)}`);
  onEvent({ type: "mission_started", mission, timestamp: new Date().toISOString() });
  const memoryContext = previousCeoAggregate?.trim()
    ? `\n\nPrevious aggregated CEO response for memory:\n${previousCeoAggregate.trim()}`
    : "";

  const [agentsConfig, routingRules] = await Promise.all([
    loadJsonConfig("config/agents.json"),
    loadJsonConfig("config/routing-rules.json")
  ]);

  const client = createAnthropicClient();
  const selectedExecutiveIds = pickExecutives(mission, routingRules);
  console.log(`[jarvis] selected executives: ${selectedExecutiveIds.join(", ") || "none"}`);
  onEvent({ type: "routing_completed", executives: selectedExecutiveIds });
  const ceoPrompt = await loadPrompt(agentsConfig.ceo.prompt_file);

  throwIfCancelled();
  onEvent({ type: "ceo_initial_started" });
  onEvent({ type: "ceo_message", message: "Alright my team, let's build a plan." });
  const ceoInitial = await runStructuredAgent({
    label: "ceo-initial",
    system: ceoPrompt,
    prompt: `Mission:\n${mission}\n\nSelected executives: ${selectedExecutiveIds.join(", ")}${memoryContext}`,
    actionContext: { agentId: "ceo", role: "CEO", stage: "initial", mission }
  });
  const ceoOutput = ceoInitial.summary;
  onEvent({ type: "ceo_initial_completed", output: ceoOutput, actions_executed: ceoInitial.actionResults });

  const executiveRuns = selectedExecutiveIds.map(async (execId) => {
    throwIfCancelled();
    const executive = getById(agentsConfig.executives, execId);
    if (!executive) return null;
    console.log(`[jarvis] executive branch start: ${executive.id}`);
    onEvent({ type: "executive_started", executiveId: executive.id, executiveName: executive.name });

    const executivePrompt = await loadPrompt(executive.prompt_file);
    const specialistRuns = (executive.subordinates || []).map(async (specialistId) => {
      throwIfCancelled();
      const specialist = getById(agentsConfig.specialists, specialistId);
      if (!specialist) return null;
      onEvent({
        type: "specialist_started",
        executiveId: executive.id,
        specialistId: specialist.id,
        specialistName: specialist.name
      });

      const specialistPrompt = await loadPrompt(specialist.prompt_file);
      const specialistRun = await runStructuredAgent({
        label: `${executive.id}:${specialist.id}`,
        system: specialistPrompt,
        prompt: `Mission:\n${mission}\n\nContext from ${executive.title}: ${ceoOutput}${memoryContext}`,
        actionContext: {
          agentId: specialist.id,
          role: specialist.title,
          stage: "specialist",
          executiveId: executive.id,
          mission
        }
      });
      throwIfCancelled();
      const output = specialistRun.summary;
      onEvent({
        type: "specialist_completed",
        executiveId: executive.id,
        specialistId: specialist.id,
        specialistName: specialist.name,
        output,
        actions_executed: specialistRun.actionResults
      });

      return {
        id: specialist.id,
        name: specialist.name,
        title: specialist.title,
        output
      };
    });

    const specialists = (await Promise.all(specialistRuns)).filter(Boolean);
    throwIfCancelled();

    const executiveRun = await runStructuredAgent({
      label: `${executive.id}:summary`,
      system: executivePrompt,
      prompt: `Mission:\n${mission}\n\nCEO synthesis:\n${ceoOutput}\n\nSpecialist outputs:\n${JSON.stringify(
        specialists,
        null,
        2
      )}${memoryContext}`,
      actionContext: {
        agentId: executive.id,
        role: executive.title,
        stage: "executive-summary",
        mission
      }
    });
    const executiveOutput = executiveRun.summary;
    throwIfCancelled();

    console.log(`[jarvis] executive branch completed: ${executive.id}`);
    onEvent({
      type: "executive_completed",
      executiveId: executive.id,
      executiveName: executive.name,
      output: executiveOutput,
      specialists,
      actions_executed: executiveRun.actionResults
    });

    return {
      id: executive.id,
      name: executive.name,
      title: executive.title,
      output: executiveOutput,
      specialists
    };
  });

  const executives = (await Promise.all(executiveRuns)).filter(Boolean);
  throwIfCancelled();

  onEvent({ type: "ceo_final_started" });
  onEvent({ type: "ceo_message", message: "Now I got everything. Here's what I think." });
  const ceoFinal = await runStructuredAgent({
    label: "ceo-final",
    system: ceoPrompt,
    prompt: `Mission:\n${mission}\n\nExecutive branch outputs:\n${JSON.stringify(
      executives,
      null,
      2
    )}${memoryContext}\n\nReturn the final CEO response in under 100 words.`,
    actionContext: { agentId: "ceo", role: "CEO", stage: "final", mission }
  });
  const final = ceoFinal.summary;
  throwIfCancelled();

  const result = {
    mission,
    ceo: {
      id: agentsConfig.ceo.id,
      name: agentsConfig.ceo.name,
      title: agentsConfig.ceo.title
    },
    executives,
    final,
    timestamp: new Date().toISOString()
  };

  onEvent({ type: "mission_completed", result, actions_executed: ceoFinal.actionResults });
  console.log(`[jarvis] mission completed in ${Date.now() - startedAt}ms`);
  return result;
}

export async function executeMission(mission, previousCeoAggregate = "") {
  return executeMissionStreaming(mission, () => {}, previousCeoAggregate);
}
