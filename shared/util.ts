import { Procedure, ProgramStats } from "./eval.ts";

export function fill<T>(len: number, v: T | ((idx: number) => T)): T[] {
	if (typeof v == "function") {
		return [...new Array(len) as unknown[]].map((_, i): T => (v as ((idx: number) => T))(i));
	}
	return [...new Array(len) as unknown[]].map(() => v);
}

export function stringifyExtra(value: unknown) {
	return JSON.stringify(value, (_, v: unknown) => {
		if (v instanceof Map) return { __dtype: "map", value: [...v.entries()] };
		else if (v instanceof Set) return { __dtype: "set", value: [...v.values()] };
		else if (typeof v == "bigint") return { __dtype: "bigint", value: v.toString() };
		return v;
	});
}

export function parseExtra(str: string | null): unknown {
	return str == null ? null : JSON.parse(str, (_, v) => {
		const v2 = v as { __dtype: "set"; value: [unknown][] } | {
			__dtype: "map";
			value: [unknown, unknown][];
		} | { __dtype: "bigint"; value: string } | { __dtype: undefined };
		if (v2 != null && typeof v2 == "object") {
			if (v2.__dtype == "map") return new Map(v2.value);
			else if (v2.__dtype == "set") return new Set(v2.value);
			else if (v2.__dtype == "bigint") return BigInt(v2.value);
		}
		return v2;
	});
}

export const COUNT_PLAY_INTERVAL_SECONDS = 2*3600;

export type CountStage = { stage: string };
export type AddSolve = {
	stage: string;
	procs: ReadonlyMap<number, Procedure>;
	entry: number;
	username: string | null;
	token: string | null;
};
export const validUsernameRe = "^[A-Za-z0-9 _\\-]{5,20}$";
export type AddSolveResponse = {
	token: string;
	id: number;
	username: string | null;
	stats: ProgramStats; // stats on hidden testcases
};
export type StageStats = { stage: string; orderBy: "time" | "registers" | "nodes" };
export type StageStatsResponse = (ProgramStats & { username: string | null; id: number })[];
export type SetUsername = { token: string; username: string | null };

export type API = {
	solve: { request: AddSolve; response: AddSolveResponse };
	stats: { request: StageStats; response: StageStatsResponse };
	setusername: { request: SetUsername };
	count: { request: CountStage };
};

export type ServerResponse<K extends keyof API> = { type: "error"; message: string } | {
	type: "ok";
	data: API[K] extends { response: unknown } ? API[K]["response"] : null;
};

export const strToInt = (s: string) => {
	if (!/^-?\d+$/.test(s)) return null;
	try {
		return BigInt(s);
	} catch {
		return null;
	}
};

export const toPrecStat = (x: number, y?: string) =>
	`${x > 1e5 ? x.toPrecision(2) : x}${y != undefined ? ` ${y}${x == 1 ? "" : "s"}` : ""}`;

export const statsArr = (
	stats: ProgramStats,
) => [
	toPrecStat(stats.time, "step"),
	toPrecStat(stats.nodes, "instruction"),
	toPrecStat(stats.registers, "register"),
];
