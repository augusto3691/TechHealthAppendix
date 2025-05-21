// app/api/analyze/route.ts
import llm from "@/lib/llm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    const aiMsg = await llm.invoke([
      [
        "system",
        "You are a helpful assistant that analyze a data from github repository and create a dynamic pitch deck appendix generator that audits your codebase to build investor confidence. Try to be more textual. The scores ar arbitrary so dont mention then, only use to create a concept from what is a good repo",
      ],
      ["human", "Analyze this data: " + JSON.stringify(data)],
    ]);

    // 6. Prepare Response
    return NextResponse.json({
      message: aiMsg.content,
    });
  } catch (err) {
    console.error("Error generating response:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
