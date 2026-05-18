import { loadJsonConfig, loadPrompt } from "./config.js";
import { createAnthropicClient, runAgent } from "./anthropicClient.js";

function pickExecutives(mission, routingRules) {
  const lcMission = mission.toLowerCase();
  const matched = routingRules.routing
    .filter((rule) =>
      rule.keywords.some((keyword) => lcMission.includes(keyword.toLowerCase()))
    )
    .map((rule) => rule.agent);

  if (matched.length > 0) {
    return [...new Set(matched)];
  }

  if (routingRules.default_behavior.route_all_executives_if_unclear) {
    return routingRules.routing.map((rule) => rule.agent);
  }

  return routingRules.default_behavior.fallback_executives || ["cto"];
}

function getById(items, id) {
  return items.find((item) => item.id === id);
}

export async function getOrganization() {
  return loadJsonConfig("config/agents.json");
}

export async function executeMission(mission) {
  const startedAt = Date.now();
  console.log(`[jarvis] mission received: ${mission.slice(0, 120)}`);

  const [agentsConfig, routingRules] = await Promise.all([
    loadJsonConfig("config/agents.json"),
    loadJsonConfig("config/routing-rules.json"),
  ]);

  const client = createAnthropicClient();
  const selectedExecutiveIds = pickExecutives(mission, routingRules);
  console.log(
    `[jarvis] selected executives: ${selectedExecutiveIds.join(", ") || "none"}`
  );

  const ceoPrompt = await loadPrompt(agentsConfig.ceo.prompt_file);

  const ceoOutput = await runAgent({
    client,
    system: ceoPrompt,
    prompt: `Mission:\n${mission}\n\nSelected executives: ${selectedExecutiveIds.join(", ")}`,
    label: "ceo-initial",
  });

  const executiveRuns = selectedExecutiveIds.map(async (execId) => {
    const executive = getById(agentsConfig.executives, execId);
    if (!executive) return null;

    console.log(`[jarvis] executive branch start: ${executive.id}`);
    const executivePrompt = await loadPrompt(executive.prompt_file);

    const specialistRuns = (executive.subordinates || []).map(
      async (specialistId) => {
        const specialist = getById(agentsConfig.specialists, specialistId);
        if (!specialist) return null;

        const specialistPrompt = await loadPrompt(specialist.prompt_file);
        const output = await runAgent({
          client,
          system: specialistPrompt,
          prompt: `Mission:\n${mission}\n\nContext from ${executive.title}: ${ceoOutput}`,
          label: `${executive.id}:${specialist.id}`,
        });

        return {
          id: specialist.id,
          name: specialist.name,
          title: specialist.title,
          output,
        };
      }
    );

    const specialists = (await Promise.all(specialistRuns)).filter(Boolean);

    const executiveOutput = await runAgent({
      client,
      system: executivePrompt,
      prompt: `Mission:\n${mission}\n\nCEO synthesis:\n${ceoOutput}\n\nSpecialist outputs:\n${JSON.stringify(
        specialists,
        null,
        2
      )}`,
      label: `${executive.id}:summary`,
    });

    console.log(`[jarvis] executive branch completed: ${executive.id}`);

    return {
      id: executive.id,
      name: executive.name,
      title: executive.title,
      output: executiveOutput,
      specialists,
    };
  });

  const executives = (await Promise.all(executiveRuns)).filter(Boolean);

  const final = await runAgent({
    client,
    system: ceoPrompt,
    prompt: `Mission:\n${mission}\n\nExecutive branch outputs:\n${JSON.stringify(
      executives,
      null,
      2
    )}`,
    label: "ceo-final",
  });

  console.log(`[jarvis] mission completed in ${Date.now() - startedAt}ms`);

  return {
    mission,
    ceo: {
      id: agentsConfig.ceo.id,
      name: agentsConfig.ceo.name,
      title: agentsConfig.ceo.title,
    },
    selected_executives: selectedExecutiveIds,
    executives,
    final,
    timestamp: new Date().toISOString(),
  };
}
