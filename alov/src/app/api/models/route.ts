import { NextResponse } from "next/server"
import { cloudModels, localModels, performanceModes } from "@/lib/ai/models"

export async function GET() {
  return NextResponse.json({
    localModels,
    cloudModels,
    performanceModes
  })
}
