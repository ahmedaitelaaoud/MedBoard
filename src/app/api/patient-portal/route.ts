import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Role } from "@/lib/constants";
import { unauthorized, forbidden, notFound, serverError } from "@/lib/errors";

type StaffRole = "DOCTOR" | "NURSE";

interface ScheduleItem {
  id: string;
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  timeLabel: string;
  scheduledAt: string;
  staffRole: StaffRole;
  staffName: string;
  title: string;
  details: string;
  source: "planned" | "task";
}

const DAY_WINDOW = 5;

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function toDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toTimeLabel(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function withTime(date: Date, hour: number, minute: number): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function makeVisit(params: {
  id: string;
  when: Date;
  staffRole: StaffRole;
  staffName: string;
  title: string;
  details: string;
  source: "planned" | "task";
}): ScheduleItem {
  return {
    id: params.id,
    dayKey: toDayKey(params.when),
    dayLabel: toDayLabel(params.when),
    dateLabel: toDateLabel(params.when),
    timeLabel: toTimeLabel(params.when),
    scheduledAt: params.when.toISOString(),
    staffRole: params.staffRole,
    staffName: params.staffName,
    title: params.title,
    details: params.details,
    source: params.source,
  };
}

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    if (user.role !== Role.PATIENT) {
      return forbidden("Patient access only");
    }

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { patientId: true },
    });

    if (!account?.patientId) {
      return notFound("No patient profile is linked to this account");
    }

    const patient = await prisma.patient.findUnique({
      where: { id: account.patientId },
      include: {
        room: {
          select: {
            number: true,
            floor: { select: { name: true } },
            ward: { select: { name: true } },
          },
        },
        medicalRecord: {
          select: {
            diagnosisSummary: true,
            currentPlan: true,
          },
        },
        assignments: {
          where: { active: true },
          include: {
            doctor: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
            nurse: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
          },
          take: 1,
        },
      },
    });

    if (!patient) {
      return notFound("Patient not found");
    }

    const activeAssignment = patient.assignments[0] ?? null;
    const schedule: ScheduleItem[] = [];

    const today = startOfDay(new Date());
    const rangeEnd = addDays(today, DAY_WINDOW - 1);
    rangeEnd.setHours(23, 59, 59, 999);

    if (activeAssignment?.nurse) {
      const nurseName = `${activeAssignment.nurse.firstName} ${activeAssignment.nurse.lastName}`;
      for (let i = 0; i < DAY_WINDOW; i++) {
        const day = addDays(today, i);
        schedule.push(
          makeVisit({
            id: `planned-nurse-morning-${i}`,
            when: withTime(day, 9, 0),
            staffRole: "NURSE",
            staffName: nurseName,
            title: "Nurse care visit",
            details: "Vitals check, medication review, and comfort assessment.",
            source: "planned",
          })
        );

        if (i % 2 === 0) {
          schedule.push(
            makeVisit({
              id: `planned-nurse-afternoon-${i}`,
              when: withTime(day, 15, 30),
              staffRole: "NURSE",
              staffName: nurseName,
              title: "Nurse follow-up",
              details: "Afternoon follow-up to monitor response and ongoing care needs.",
              source: "planned",
            })
          );
        }
      }
    }

    if (activeAssignment?.doctor) {
      const doctorName = `Dr. ${activeAssignment.doctor.firstName} ${activeAssignment.doctor.lastName}`;
      for (let i = 0; i < DAY_WINDOW; i++) {
        const day = addDays(today, i);
        schedule.push(
          makeVisit({
            id: `planned-doctor-round-${i}`,
            when: withTime(day, 11, 15),
            staffRole: "DOCTOR",
            staffName: doctorName,
            title: "Doctor round",
            details: "Clinical review and care plan updates.",
            source: "planned",
          })
        );
      }
    }

    const dueTasks = await prisma.task.findMany({
      where: {
        patientId: patient.id,
        status: { not: "COMPLETED" },
        dueDate: {
          gte: today,
          lte: rangeEnd,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    });

    for (const task of dueTasks) {
      if (!task.dueDate) continue;

      const staffRole: StaffRole = task.assignedTo.role === Role.DOCTOR ? "DOCTOR" : "NURSE";
      const staffName = `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;

      schedule.push(
        makeVisit({
          id: `task-${task.id}`,
          when: task.dueDate,
          staffRole,
          staffName,
          title: task.title,
          details: task.description?.trim() || "Planned follow-up related to your treatment.",
          source: "task",
        })
      );
    }

    schedule.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    return NextResponse.json({
      data: {
        patient: {
          id: patient.id,
          patientCode: patient.patientCode,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          sex: patient.sex,
          status: patient.status,
          allergies: patient.allergies,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          admissionDate: patient.admissionDate,
          room: patient.room,
          diagnosisSummary: patient.medicalRecord?.diagnosisSummary || null,
          currentPlan: patient.medicalRecord?.currentPlan || null,
          assignedTeam: {
            doctor: activeAssignment?.doctor || null,
            nurse: activeAssignment?.nurse || null,
          },
        },
        schedule,
      },
    });
  } catch (error) {
    console.error("[GET /api/patient-portal]", error);
    return serverError();
  }
}
