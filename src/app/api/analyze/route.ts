// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub repo URL." }, { status: 400 });
    }

    const [_, owner, repo] = match;

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "GitHub token not configured." }, { status: 500 });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "User-Agent": "TechHealthAnalyzer",
      Accept: "application/vnd.github+json",
    };

    // Basic repo info
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    const repoData = await repoRes.json();

    // Languages
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
    const langData = await langRes.json();

    // Contributors
    const contribRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors`, { headers });
    const contribData = await contribRes.json();

    // File tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers });
    const treeData = await treeRes.json();
    const filePaths: string[] = treeData?.tree?.map((f: any) => f.path) || [];

    const hasCI = filePaths.some((path) =>
      path.includes(".github/workflows") || path.includes(".gitlab-ci") || path.includes("vercel.json") || path.includes("netlify.toml")
    );

    const hasTests = filePaths.some((path) =>
      /test|__tests__|\.spec\.|\.test\./i.test(path)
    );

    const hasLinting = filePaths.some((path) =>
      path.includes(".eslintrc") || path.includes("prettier") || path.includes("tsconfig.json")
    );

    const hasTODOs = filePaths.some((path) =>
      /todo|deprecated|legacy/i.test(path)
    );

    // GitHub Actions (deployment frequency)
    const workflowRunsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`, { headers });
    const workflowData = await workflowRunsRes.json();
    const recentRuns = workflowData?.workflow_runs || [];

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deploysLast7Days = recentRuns.filter((run: any) =>
      new Date(run.created_at) > weekAgo
    ).length;
    const deployScore = Math.min(deploysLast7Days, 5) * 0.5;

    // Issues
    const issuesOpenRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`, { headers });
    const issuesClosedRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=closed&per_page=100`, { headers });

    const openIssues = await issuesOpenRes.json();
    const closedIssues = await issuesClosedRes.json();

    const totalOpenIssues = Array.isArray(openIssues) ? openIssues.length : 0;
    const totalClosedIssues = Array.isArray(closedIssues) ? closedIssues.length : 0;
    const totalIssues = totalOpenIssues + totalClosedIssues;

    let issueResolutionRate = totalIssues > 0 ? totalClosedIssues / totalIssues : 0;

    let issueScore = 0;
    if (issueResolutionRate >= 0.9) issueScore = 2;
    else if (issueResolutionRate >= 0.75) issueScore = 1.5;
    else if (issueResolutionRate >= 0.5) issueScore = 1;
    else if (issueResolutionRate >= 0.25) issueScore = 0.5;

    // Score breakdown
    const ciScore = hasCI ? 2 : 0;
    const testScore = hasTests ? 2.5 : 0;
    const lintScore = hasLinting ? 1.5 : 0;
    const todoScore = hasTODOs ? 0 : 1.5;

    const techScore = parseFloat((ciScore + testScore + lintScore + todoScore + deployScore + issueScore).toFixed(1));

    return NextResponse.json({
      repo: {
        name: repoData.name,
        description: repoData.description,
        created_at: repoData.created_at,
        pushed_at: repoData.pushed_at,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        open_issues: repoData.open_issues_count,
        languages: langData,
        contributors: contribData.map((c: any) => ({
          login: c.login,
          contributions: c.contributions,
        })),
      },
      analysis: {
        hasCI,
        hasTests,
        hasLinting,
        hasTODOs,
        deploysLast7Days,
        issueStats: {
          totalOpenIssues,
          totalClosedIssues,
          resolutionRate: parseFloat(issueResolutionRate.toFixed(2)),
        },
        deploymentRuns: recentRuns.map((run: any) => ({
          id: run.id,
          name: run.name,
          status: run.status,
          conclusion: run.conclusion,
          created_at: run.created_at,
        })),
      },
      score: {
        value: techScore,
        outOf: 12,
        breakdown: {
          ciScore,
          testScore,
          lintScore,
          todoScore,
          deployScore,
          issueScore,
        },
      },
    });
  } catch (err) {
    console.error("Error analyzing repo:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}