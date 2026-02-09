import { cloudModels, localModels, type ModelSpec, type PerformanceMode } from "./models"

export type RoutingInput = {
  mode?: PerformanceMode
  userSelectedModel?: string | null
  allowSlowInfiniteMode?: boolean
  localAvailability?: Record<string, boolean>
  cloudAvailability?: Record<string, boolean>
}

export type RoutingResult = {
  model: ModelSpec
  source: "local" | "cloud" | "fallback"
  mode: PerformanceMode
}

const allLocal = [...localModels.large, ...localModels.medium, ...localModels.small]

function isAvailable(
  modelId: string,
  availability: Record<string, boolean> | undefined
) {
  if (!availability) return true
  const value = availability[modelId]
  return value === undefined ? true : value
}

function pickRotating(list: ModelSpec[]) {
  const index = list.length === 0 ? 0 : Math.floor(Date.now() / 1000) % list.length
  return list[index]
}

function pickFirstAvailable(
  list: ModelSpec[],
  availability: Record<string, boolean> | undefined
) {
  return list.find((model) => isAvailable(model.id, availability))
}

function buildLocalCandidates(mode: PerformanceMode, allowSlowInfiniteMode?: boolean) {
  if (allowSlowInfiniteMode) return [...localModels.small]
  if (mode === "speed") return [...localModels.small]
  if (mode === "balanced") return [...localModels.medium, ...localModels.small]
  if (mode === "intelligence") return [...localModels.large, ...localModels.medium]
  return [...localModels.small]
}

export async function checkLocalModelHealth(): Promise<Record<string, boolean>> {
  const availability: Record<string, boolean> = {}
  const allModels = [...localModels.large, ...localModels.medium, ...localModels.small]
  
  for (const m of allModels) {
    try {
      // In a real scenario, we'd fetch from http://localhost:11434/api/tags (Ollama)
      // or check if the process is running.
      // For this demo, we'll assume the small models are always available locally.
      availability[m.id] = m.tier === "small"
    } catch {
      availability[m.id] = false
    }
  }
  return availability
}

export function selectModel(input: RoutingInput): RoutingResult {
  const mode = input.mode ?? "balanced"
  const { userSelectedModel, localAvailability, cloudAvailability } = input

  if (userSelectedModel) {
    const localMatch = allLocal.find((model) => model.id === userSelectedModel)
    if (localMatch && isAvailable(localMatch.id, localAvailability)) {
      return { model: localMatch, source: "local", mode }
    }
    const cloudMatch = cloudModels.find((model) => model.id === userSelectedModel)
    if (cloudMatch && isAvailable(cloudMatch.id, cloudAvailability)) {
      return { model: cloudMatch, source: "cloud", mode }
    }
  }

  if (mode === "unlimited") {
    const rotating = pickRotating(cloudModels)
    if (rotating && isAvailable(rotating.id, cloudAvailability)) {
      return { model: rotating, source: "cloud", mode }
    }
  }

  const localCandidate = pickFirstAvailable(
    buildLocalCandidates(mode, input.allowSlowInfiniteMode),
    localAvailability
  )
  if (localCandidate) {
    return { model: localCandidate, source: "local", mode }
  }

  const cloudCandidate = pickFirstAvailable(cloudModels, cloudAvailability)
  if (cloudCandidate) {
    return { model: cloudCandidate, source: "cloud", mode }
  }

  const fallback = pickFirstAvailable(localModels.small, localAvailability) ?? localModels.small[0]
  return { model: fallback, source: "fallback", mode }
}
