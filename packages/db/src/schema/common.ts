import { customType } from "drizzle-orm/pg-core";

export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  fromDriver(value) {
    if (typeof value !== "string") {
      return [];
    }

    return value
      .replace("[", "")
      .replace("]", "")
      .split(",")
      .filter(Boolean)
      .map(Number);
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  }
});
