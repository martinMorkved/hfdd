/** Program shape with weeks/days/exercises (used by Dashboard, Programs, ProgramCard, etc.) */
export type ProgramWithWeeks = {
    weeks: { days: { exercises: unknown[] }[] }[];
};

export type ProgramStructure = "weekly" | "rotating" | "block" | "frequency";

export function getTotalExercises(program: ProgramWithWeeks): number {
    return program.weeks.reduce((total, week) => {
        return total + week.days.reduce((dayTotal, day) => {
            return dayTotal + day.exercises.length;
        }, 0);
    }, 0);
}

export function getStructureLabel(structure: string | ProgramStructure): string {
    switch (structure) {
        case "weekly": return "Weekly (7-day cycles)";
        case "rotating": return "Rotating (A/B/C days)";
        case "block": return "Block-based (Mesocycles)";
        case "frequency": return "Frequency-based (Full body)";
        default: return String(structure);
    }
}
