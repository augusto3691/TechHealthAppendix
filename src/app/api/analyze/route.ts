// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();

    // Validate GitHub URL
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

    // 1. Basic Repo Data
    const [repoRes, langRes, contribRes, treeRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contributors`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers }),
    ]);

    const [repoData, langData, contribData, treeData] = await Promise.all([
      repoRes.json(),
      langRes.json(),
      contribRes.json(),
      treeRes.json().catch(() => ({ tree: [] })), // Fallback if tree fails
    ]);

    // 2. File System Analysis
    const filePaths: string[] = treeData?.tree?.map((f: any) => f.path) || [];
    const hasCI = filePaths.some(path => 
      /\.github\/workflows|\.gitlab-ci|vercel\.json|netlify\.toml/i.test(path)
    );
    const hasTests = filePaths.some(path => 
      /test|__tests__|\.spec\.|\.test\./i.test(path)
    );
    const hasLinting = filePaths.some(path => 
      /\.eslintrc|prettier|tsconfig\.json/i.test(path)
    );
    const hasTODOs = filePaths.some(path => 
      /todo|deprecated|legacy/i.test(path)
    );

    // 3. Time-Based Effectiveness Metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const [
      commitActivityRes,
      closedIssuesRes,
      workflowRunsRes,
      issuesOpenRes,
      issuesClosedRes
    ] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=closed&since=${thirtyDaysAgo}&per_page=100`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?created=>=${thirtyDaysAgo}&per_page=30`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=closed&per_page=100`, { headers }),
    ]);

    const [
      commitActivityData,
      recentlyClosedIssues,
      workflowData,
      openIssues,
      closedIssues
    ] = await Promise.all([
      commitActivityRes.json().catch(() => []), // Fallback if stats fail
      closedIssuesRes.json(),
      workflowRunsRes.json(),
      issuesOpenRes.json(),
      issuesClosedRes.json(),
    ]);

    // 4. Calculate Effectiveness Metrics
    // Recent commit activity (last 4 weeks)
    const recentCommits = commitActivityData
      ?.slice(-4)
      .reduce((sum: number, week: any) => sum + week.total, 0) || 0;

    // Recent issue resolution rate
    const closedRecently = Array.isArray(recentlyClosedIssues) ? recentlyClosedIssues.length : 0;
    const totalIssues = (Array.isArray(openIssues) ? openIssues.length : 0) + 
                       (Array.isArray(closedIssues) ? closedIssues.length : 0);
    const issueResolutionRateRecent = totalIssues > 0 ? closedRecently / totalIssues : 0;

    // Deployment frequency
    const successfulDeploys = workflowData.workflow_runs?.filter(
      (run: any) => run.conclusion === 'success'
    ).length || 0;

    // 5. Score Calculations
    // Technical Health Score (0-12)
    const deployScore = Math.min(successfulDeploys, 5) * 0.5;
    const ciScore = hasCI ? 2 : 0;
    const testScore = hasTests ? 2.5 : 0;
    const lintScore = hasLinting ? 1.5 : 0;
    const todoScore = hasTODOs ? 0 : 1.5;
    
    let issueScore = 0;
    if (issueResolutionRateRecent >= 0.9) issueScore = 2;
    else if (issueResolutionRateRecent >= 0.75) issueScore = 1.5;
    else if (issueResolutionRateRecent >= 0.5) issueScore = 1;
    else if (issueResolutionRateRecent >= 0.25) issueScore = 0.5;

    const techScore = parseFloat((ciScore + testScore + lintScore + todoScore + deployScore + issueScore).toFixed(1));

    // Effectiveness Score (0-10)
    const effectivenessScore = 
      Math.min(recentCommits, 20) * 0.2 +         // Max 4 points
      Math.min(successfulDeploys, 10) * 0.4 +      // Max 4 points
      Math.min(issueResolutionRateRecent * 10, 2); // Max 2 points

    const normalizedEffectiveness = parseFloat(Math.min(effectivenessScore, 10).toFixed(1));

    // 6. Prepare Response
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
        technical: {
          hasCI,
          hasTests,
          hasLinting,
          hasTODOs,
          deploysLast30Days: successfulDeploys,
        },
        effectiveness: {
          recentCommits,
          issuesClosedRecently: closedRecently,
          issueResolutionRateRecent: parseFloat(issueResolutionRateRecent.toFixed(2)),
          commitActivity: commitActivityData?.map((week: any) => ({
            week: week.week,
            commits: week.total,
          })),
        },
      },
      scores: {
        technicalHealth: {
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
        effectiveness: {
          value: normalizedEffectiveness,
          outOf: 10,
          breakdown: {
            commitActivity: parseFloat((Math.min(recentCommits, 20) * 0.2).toFixed(1)),
            deploymentFrequency: parseFloat((Math.min(successfulDeploys, 10) * 0.4).toFixed(1)),
            issueResolution: parseFloat((Math.min(issueResolutionRateRecent * 10, 2)).toFixed(1)),
          },
        },
        combined: parseFloat((techScore + normalizedEffectiveness).toFixed(1)),
      },
    });

  } catch (err) {
    console.error("Error analyzing repo:", err);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}