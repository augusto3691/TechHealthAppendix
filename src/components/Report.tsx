import { CircleCheck, CircleX, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Table, TableBody, TableCell, TableRow } from "./ui/table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import numeral from "numeral";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

const chartConfig = {
  commits: {
    label: "Commits",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface WeeklyCommit {
  week: number;
  commits: number;
}

interface MonthlyCommit {
  date: string; // Formato "YYYY-MM"
  commits: number;
}

export function Report({ repoData, aiData }: any) {
  const chartData = (commitActivity: WeeklyCommit[]): MonthlyCommit[] => {
    const monthlyData: Record<string, number> = {};

    commitActivity.forEach(({ week, commits }) => {
      const date = new Date(week * 1000);

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + commits;
    });

    return Object.entries(monthlyData)
      .map(([date, commits]) => ({ date, commits }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  return (
    <div className="container mt-20 mx-auto w-2/3">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-5xl font-sans pt-2 md:pt-10 relative z-20 font-bold tracking-tight pb-2">
            {repoData.repo.name}
          </h2>
          <p>{repoData.repo.description} </p>
        </div>
        <div className="flex items-center space-x-2">
          <Star />
          <h2 className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-xl md:text-3xl lg:text-4xl font-sans relative z-20 font-bold tracking-tight">
            {numeral(repoData.repo.stars).format("0a")}
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-transparent">
          <CardHeader>
            <CardTitle>Code Quality</CardTitle>
            <CardDescription>Checklist of good practices</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="p-0">Has CI/CD</TableCell>
                  <TableCell className="flex items-center justify-end">
                    {repoData.analysis.technical.hasCI ? (
                      <CircleCheck className="text-green-500" />
                    ) : (
                      <CircleX className="text-red-500" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="p-0">Has Tests</TableCell>
                  <TableCell className="flex items-center justify-end">
                    {repoData.analysis.technical.hasTests ? (
                      <CircleCheck className="text-green-500" />
                    ) : (
                      <CircleX className="text-red-500" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="p-0">Has Lint</TableCell>
                  <TableCell className="flex items-center justify-end">
                    {repoData.analysis.technical.hasLinting ? (
                      <CircleCheck className="text-green-500" />
                    ) : (
                      <CircleX className="text-red-500" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="p-0">Has To Do</TableCell>
                  <TableCell className="flex items-center justify-end">
                    {repoData.analysis.technical.hasTODOs ? (
                      <CircleCheck className="text-green-500" />
                    ) : (
                      <CircleX className="text-red-500" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="bg-transparent col-span-2">
          <CardHeader>
            <CardTitle>Code Activity</CardTitle>
            <CardDescription>Analysis of commits over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={chartData(repoData.analysis.effectiveness.commitActivity)}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <defs>
                  <linearGradient id="fillCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-commits)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-commits)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="commits"
                  type="natural"
                  fill="url(#fillCommits)"
                  fillOpacity={0.4}
                  stroke="var(--color-commits)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="bg-transparent col-span-3 mb-20">
          <CardHeader>
            <CardTitle>Technical Infrastructure Excellence</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap">{aiData}</CardContent>
        </Card>
      </div>
    </div>
  );
}
