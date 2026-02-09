export type PerformanceMode =
  | "speed"
  | "balanced"
  | "intelligence"
  | "unlimited"

export type ModelTier = "small" | "medium" | "large"

export type ModelSource = "local" | "cloud"

export type ModelSpec = {
  id: string
  label: string
  tier: ModelTier
  source: ModelSource
}

export const localModels: Record<ModelTier, ModelSpec[]> = {
  large: [
    { id: "deepseek-r1", label: "DeepSeek-R1", tier: "large", source: "local" },
    {
      id: "deepseek-coder-v2",
      label: "DeepSeek-Coder-V2",
      tier: "large",
      source: "local"
    },
    {
      id: "qwen2.5-coder-32b",
      label: "Qwen2.5 Coder 32B",
      tier: "large",
      source: "local"
    },
    {
      id: "qwen2.5-coder-14b",
      label: "Qwen2.5 Coder 14B",
      tier: "large",
      source: "local"
    },
    {
      id: "starcoder2-15b",
      label: "StarCoder2 15B",
      tier: "large",
      source: "local"
    },
    {
      id: "mistral-nemo-12b",
      label: "Mistral Nemo 12B",
      tier: "large",
      source: "local"
    },
    { id: "codestral", label: "Codestral", tier: "large", source: "local" }
  ],
  medium: [
    {
      id: "qwen2.5-coder-7b",
      label: "Qwen2.5 Coder 7B",
      tier: "medium",
      source: "local"
    },
    {
      id: "deepseek-coder-6.7b",
      label: "DeepSeek-Coder 6.7B",
      tier: "medium",
      source: "local"
    },
    { id: "mistral-7b", label: "Mistral 7B", tier: "medium", source: "local" },
    {
      id: "starcoder2-7b",
      label: "StarCoder2 7B",
      tier: "medium",
      source: "local"
    }
  ],
  small: [
    { id: "phi-3-mini", label: "Phi-3 Mini", tier: "small", source: "local" },
    { id: "gemma-2b", label: "Gemma 2B", tier: "small", source: "local" },
    { id: "gemma-7b", label: "Gemma 7B", tier: "small", source: "local" },
    {
      id: "starcoder2-3b",
      label: "StarCoder2 3B",
      tier: "small",
      source: "local"
    },
    { id: "qwen-1.8b", label: "Qwen 1.8B", tier: "small", source: "local" },
    {
      id: "tinyllama-1.1b",
      label: "TinyLlama 1.1B",
      tier: "small",
      source: "local"
    }
  ]
}

export const cloudModels: ModelSpec[] = [
  {
    id: "deepseek-cloud-free",
    label: "DeepSeek Cloud Free",
    tier: "large",
    source: "cloud"
  },
  {
    id: "huggingface-free",
    label: "HuggingFace Inference Free",
    tier: "medium",
    source: "cloud"
  },
  {
    id: "mistral-free",
    label: "Mistral AI Free Tier",
    tier: "large",
    source: "cloud"
  },
  {
    id: "gemini-nano",
    label: "Gemini Nano (Client)",
    tier: "small",
    source: "cloud"
  },
  {
    id: "together-free",
    label: "Together AI Free Credits",
    tier: "medium",
    source: "cloud"
  },
  {
    id: "openrouter-free",
    label: "OpenRouter Free Tier",
    tier: "medium",
    source: "cloud"
  },
  {
    id: "openai-compatible-free",
    label: "OpenAI-Compatible Free Endpoints",
    tier: "medium",
    source: "cloud"
  }
]

export const performanceModes = [
  { id: "speed", label: "Maximum Speed" },
  { id: "balanced", label: "Balanced" },
  { id: "intelligence", label: "Maximum Intelligence" },
  { id: "unlimited", label: "Unlimited Free" }
]
