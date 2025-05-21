
# Tech Health Appendix Generator


![hero](hero.gif)




## 📌 Overview

Generates a technical appendix with code analysis and metrics, ideal for pitching early-stage startups. It uses Langchain behind the scene to orchestrate the model invocation and a public Github API to generate data to prompt the models.

## ⚙️ Tecnologias utilizadas

- Nextjs, tailwind and shadcn for frontend (Due to rapid prototyping and code consistency)
- Axios for API calls (More verbose and opinionated than fetchter)
- Langchain for Model calls (Pretty much the standard for model orchestration and would give me the flexibility to choose which model of which integration to use.)

## 🧠 How i used AI

Generate a base data from Github API and use that data to compose a prompt engineering and invoke that using langchain, besides that i use a deepseek along the development to improove performance on types and util libs.

## How your solution addresses the core problem

Basically the system use a repo name to gather some metadatas from that and send to a model create a technical appendix that has a strong tendency to be textual and audits a codebase to build investor confidence.

## ⏱️ Tempo total

4h15min (detalhar o tempo por fase, se possível)
