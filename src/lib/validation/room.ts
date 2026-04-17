import { z } from "zod";

export const roomUpdateSchema = z.object({
  status: z.enum(["EMPTY", "OCCUPIED", "CRITICAL", "DISCHARGE_READY", "UNDER_OBSERVATION", "UNAVAILABLE"]),
});

export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;
