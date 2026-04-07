import { NextResponse } from "next/server";

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status });

export const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });

export const serverError = (message = "INTERNAL_SERVER_ERROR") =>
  NextResponse.json({ error: message }, { status: 500 });

export const parseBoolean = (value: string | null) => {
  if (!value) {
    return false;
  }

  return ["true", "1", "yes"].includes(value.toLowerCase());
};
