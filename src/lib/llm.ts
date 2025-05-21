import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 1,
  maxRetries: 2,
});

// You can use other models from langchain (https://js.langchain.com/docs/integrations/chat/) just export a llm object, dont forget to add your keys in .env
// const llm = new ChatOpenAI({
//   model: "gpt-4o",
//   temperature: 0,
// });

export default llm;