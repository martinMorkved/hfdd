import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import type { Exercise } from "../exercises/types";

export type ProgramStructure =
    | "weekly"        // Traditional 7-day weeks
    | "rotating"      // A, B, C rotation
    | "block"         // Mesocycle blocks
    | "frequency";    // Full body, single template

export type { Exercise };

export type WorkoutExercise = {
    id: string;
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number[];
    comment?: string;
    alternatives?: string[];
};

export type WorkoutDay = {
    id: string;
    name: string;
    exercises: WorkoutExercise[];
};

export type WorkoutWeek = {
    id: string;
    weekNumber: number;
    days: WorkoutDay[];
};

export type WorkoutProgram = {
    id: string;
    name: string;
    description?: string;
    structure: ProgramStructure;
    weeks: WorkoutWeek[];
};

const isTempId = (id: string) => id != null && typeof id === "string" && id.trim().startsWith("temp-");
const nextTempId = () => `temp-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useWorkoutProgram = () => {
    const { user } = useAuth();
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [currentProgram, setCurrentProgram] = useState<WorkoutProgram | null>(null);
    const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(null);
    const [programName, setProgramName] = useState("");
    const [programDescription, setProgramDescription] = useState("");
    const [programStructure, setProgramStructure] = useState<ProgramStructure>("weekly");
    const [loading, setLoading] = useState(true);

    // Load programs from database
    useEffect(() => {
        if (user) {
            loadPrograms();
            loadActiveProgram();
        }
    }, [user]);

    const loadPrograms = async () => {
        try {
            setLoading(true);

            // Load programs
            const { data: programsData, error: programsError } = await supabase
                .from('workout_programs')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (programsError) {
                console.error('Error loading programs:', programsError);
                return;
            }

            // Load complete program data with weeks, days, and exercises
            const completePrograms = await Promise.all(
                (programsData || []).map(async (program) => {
                    const programWithData = await loadCompleteProgram(program.id);
                    return programWithData;
                })
            );

            setPrograms(completePrograms);
        } catch (err) {
            console.error('Error loading programs:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadActiveProgram = async () => {
        try {
            if (!user) return;

            // Get the user's active program (maybeSingle returns null if no rows, no error)
            const { data: activeProgramData, error } = await supabase
                .from('user_active_program')
                .select('program_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Error loading active program:', error);
                return;
            }

            if (activeProgramData) {
                // Load the complete active program
                const completeActiveProgram = await loadCompleteProgram(activeProgramData.program_id);
                setActiveProgram(completeActiveProgram);
            } else {
                setActiveProgram(null);
            }
        } catch (err) {
            console.error('Error loading active program:', err);
        }
    };

    const loadCompleteProgram = async (programId: string): Promise<WorkoutProgram> => {
        // Load weeks
        const { data: weeksData, error: weeksError } = await supabase
            .from('workout_weeks')
            .select('*')
            .eq('program_id', programId)
            .order('week_number');

        if (weeksError) {
            console.error('Error loading weeks:', weeksError);
            return { id: programId, name: '', description: '', structure: 'weekly', weeks: [] };
        }

        // Load days and exercises for each week
        const weeks = await Promise.all(
            (weeksData || []).map(async (week) => {
                const { data: daysData, error: daysError } = await supabase
                    .from('workout_days')
                    .select('*')
                    .eq('week_id', week.id)
                    .order('day_order');

                if (daysError) {
                    console.error('Error loading days:', daysError);
                    return { id: week.id, weekNumber: week.week_number, days: [] };
                }

                // Load exercises for each day
                const days = await Promise.all(
                    (daysData || []).map(async (day) => {
                        const { data: exercisesData, error: exercisesError } = await supabase
                            .from('workout_exercises')
                            .select('*')
                            .eq('day_id', day.id)
                            .order('exercise_order');

                        if (exercisesError) {
                            console.error('Error loading exercises:', exercisesError);
                            return { id: day.id, name: day.name, exercises: [] };
                        }

                        const exercises: WorkoutExercise[] = (exercisesData || []).map(ex => ({
                            id: ex.id,
                            exerciseId: ex.exercise_id,
                            exerciseName: ex.exercise_name,
                            sets: ex.sets,
                            reps: ex.reps || [],
                            comment: ex.comment || undefined,
                            alternatives: ex.alternatives || []
                        }));

                        return { id: day.id, name: day.name, exercises };
                    })
                );

                return { id: week.id, weekNumber: week.week_number, days };
            })
        );

        // Get the base program data
        const { data: programData } = await supabase
            .from('workout_programs')
            .select('*')
            .eq('id', programId)
            .single();

        return {
            id: programId,
            name: programData?.name || '',
            description: programData?.description || '',
            structure: programData?.structure as ProgramStructure || 'weekly',
            weeks
        };
    };

    const createNewProgram = async () => {
        if (!programName.trim() || !user) return;

        try {
            // Create the program
            const { data: programData, error: programError } = await supabase
                .from('workout_programs')
                .insert([{
                    user_id: user.id,
                    name: programName,
                    description: programDescription,
                    structure: programStructure
                }])
                .select()
                .single();

            if (programError) {
                console.error('Error creating program:', programError);
                return;
            }

            // Create initial week
            const { data: weekData, error: weekError } = await supabase
                .from('workout_weeks')
                .insert([{
                    program_id: programData.id,
                    week_number: 1
                }])
                .select()
                .single();

            if (weekError) {
                console.error('Error creating week:', weekError);
                return;
            }

            // Create days based on structure
            let dayNames: string[] = [];
            if (programStructure === "weekly") {
                dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            } else if (programStructure === "rotating") {
                dayNames = ["Day A", "Day B", "Day C"];
            } else if (programStructure === "block") {
                dayNames = ["Block 1", "Block 2", "Block 3", "Block 4"];
            } else if (programStructure === "frequency") {
                dayNames = ["Full Body Session"];
            }

            const daysToInsert = dayNames.map((name, index) => ({
                week_id: weekData.id,
                name,
                day_number: index + 1,
                day_order: index + 1
            }));

            const { error: daysError } = await supabase
                .from('workout_days')
                .insert(daysToInsert);

            if (daysError) {
                console.error('Error creating days:', daysError);
                return;
            }

            // Reload programs
            await loadPrograms();

            // Select the newly created program
            const newProgram = await loadCompleteProgram(programData.id);
            setCurrentProgram(newProgram);

            // Reset form
            setProgramName("");
            setProgramDescription("");
            setProgramStructure("weekly");
        } catch (err) {
            console.error('Error creating program:', err);
        }
    };

    // Update program (name, description, structure) locally only. Persisted when user clicks Save or Save and Finish.
    const updateProgramInArray = (updatedProgram: WorkoutProgram) => {
        setPrograms(prev => prev.map(p => p.id === updatedProgram.id ? updatedProgram : p));
        if (currentProgram?.id === updatedProgram.id) {
            setCurrentProgram(updatedProgram);
        }
    };

    // Add exercise to a specific day (local only). Persisted when user clicks Save or Save and Finish.
    const addExerciseToDay = (exercise: Exercise, weekNumber: number, dayName: string) => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return;

        const day = week.days.find(d => d.name === dayName);
        if (!day) return;

        const newWorkoutExercise: WorkoutExercise = {
            id: nextTempId(),
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            sets: 3,
            reps: [10, 10, 10],
            comment: undefined,
            alternatives: []
        };

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.map(w =>
                w.weekNumber === weekNumber
                    ? {
                        ...w,
                        days: w.days.map(d =>
                            d.name === dayName
                                ? { ...d, exercises: [...d.exercises, newWorkoutExercise] }
                                : d
                        )
                    }
                    : w
            )
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
    };

    // Add multiple exercises to a day in one update (for mobile multi-select). Persisted when user clicks Save or Save and Finish.
    const addExercisesToDay = (exercises: Exercise[], weekNumber: number, dayName: string) => {
        if (!currentProgram || exercises.length === 0) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return;

        const day = week.days.find(d => d.name === dayName);
        if (!day) return;

        const newWorkoutExercises: WorkoutExercise[] = exercises.map((exercise) => ({
            id: nextTempId(),
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            sets: 3,
            reps: [10, 10, 10],
            comment: undefined,
            alternatives: []
        }));

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.map(w =>
                w.weekNumber === weekNumber
                    ? {
                        ...w,
                        days: w.days.map(d =>
                            d.name === dayName
                                ? { ...d, exercises: [...d.exercises, ...newWorkoutExercises] }
                                : d
                        )
                    }
                    : w
            )
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
    };

    // Update exercise details locally only (no DB). Call saveProgramChanges() to persist.
    const updateExerciseLocal = (weekNumber: number, dayName: string, exerciseId: string, updates: Partial<WorkoutExercise>) => {
        if (!currentProgram) return;

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.map(w =>
                w.weekNumber === weekNumber
                    ? {
                        ...w,
                        days: w.days.map(d =>
                            d.name === dayName
                                ? {
                                    ...d,
                                    exercises: d.exercises.map(e =>
                                        e.exerciseId === exerciseId ? { ...e, ...updates } : e
                                    )
                                }
                                : d
                        )
                    }
                    : w
            )
        };

        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
    };

    // Persist full program state to DB (program, weeks, days, exercises). Only runs when user clicks Save or Save and Finish.
    const saveProgramChanges = async (): Promise<boolean> => {
        if (!currentProgram) return false;

        try {
            // 1. Update program row (name, description, structure)
            const { error: programError } = await supabase
                .from('workout_programs')
                .update({
                    name: currentProgram.name,
                    description: currentProgram.description ?? null,
                    structure: currentProgram.structure
                })
                .eq('id', currentProgram.id);
            if (programError) {
                console.error('Error saving program', programError);
                return false;
            }

            const realWeekIds = currentProgram.weeks.filter(w => !isTempId(w.id)).map(w => w.id);

            // 2. Insert new weeks (temp id -> real id)
            const tempToRealWeek: Record<string, string> = {};
            for (const week of currentProgram.weeks) {
                if (isTempId(week.id)) {
                    const { data: inserted, error } = await supabase
                        .from('workout_weeks')
                        .insert([{ program_id: currentProgram.id, week_number: week.weekNumber }])
                        .select('id')
                        .single();
                    if (error || !inserted) {
                        console.error('Error inserting week', error);
                        return false;
                    }
                    tempToRealWeek[week.id] = inserted.id;
                }
            }

            // 3. Delete weeks that were removed (in DB but not in current state)
            const keepWeekIds = [...realWeekIds, ...Object.values(tempToRealWeek)];
            const { data: existingWeeks } = await supabase
                .from('workout_weeks')
                .select('id')
                .eq('program_id', currentProgram.id);
            const weeksToDelete = (existingWeeks || []).filter((r: { id: string }) => !keepWeekIds.includes(r.id));
            for (const row of weeksToDelete) {
                await supabase.from('workout_weeks').delete().eq('id', (row as { id: string }).id);
            }

            // 4. For each week: sync days (insert new, update names, delete removed)
            const tempToRealDay: Record<string, string> = {};
            for (const week of currentProgram.weeks) {
                const realWeekId = tempToRealWeek[week.id] ?? week.id;

                for (const day of week.days) {
                    if (isTempId(day.id)) {
                        // New day (temp id) – insert; never send temp id to DB
                        const { data: inserted, error } = await supabase
                            .from('workout_days')
                            .insert([{ week_id: realWeekId, name: day.name, day_number: week.days.indexOf(day) + 1, day_order: week.days.indexOf(day) + 1 }])
                            .select('id')
                            .single();
                        if (error || !inserted) {
                            console.error('Error inserting day', error);
                            return false;
                        }
                        tempToRealDay[day.id] = inserted.id;
                    } else if (typeof day.id === "string" && !day.id.startsWith("temp-")) {
                        // Existing day (real UUID) – update name only; never use temp id in .eq()
                        const { error } = await supabase.from('workout_days').update({ name: day.name }).eq('id', day.id);
                        if (error) {
                            console.error('Error updating day name', day.id, error);
                            return false;
                        }
                    }
                }

                const realDayIds = week.days.filter(d => !isTempId(d.id)).map(d => d.id);
                const newDayIds = week.days.filter(d => isTempId(d.id)).map(d => tempToRealDay[d.id]);
                const keepIds = [...realDayIds, ...newDayIds];
                const { data: existingDays } = await supabase.from('workout_days').select('id').eq('week_id', realWeekId);
                const daysToDelete = (existingDays || []).filter((r: { id: string }) => !keepIds.includes(r.id));
                for (const row of daysToDelete) {
                    await supabase.from('workout_days').delete().eq('id', (row as { id: string }).id);
                }
            }

            // 5. For each day: sync exercises (insert new, update existing, delete removed)
            for (const week of currentProgram.weeks) {
                for (const day of week.days) {
                    const realDayId = tempToRealDay[day.id] ?? day.id;
                    const insertedExIds: string[] = [];

                    for (let i = 0; i < day.exercises.length; i++) {
                        const ex = day.exercises[i];
                        if (isTempId(ex.id)) {
                            const { data: inserted, error } = await supabase.from('workout_exercises').insert([{
                                day_id: realDayId,
                                exercise_id: ex.exerciseId,
                                exercise_name: ex.exerciseName,
                                sets: ex.sets,
                                reps: ex.reps,
                                comment: ex.comment ?? null,
                                alternatives: ex.alternatives ?? [],
                                exercise_order: i + 1
                            }]).select('id').single();
                            if (error) {
                                console.error('Error inserting exercise', error);
                                return false;
                            }
                            if (inserted?.id) insertedExIds.push(inserted.id);
                        } else if (typeof ex.id === "string" && !ex.id.startsWith("temp-")) {
                            // Existing exercise (real UUID) – update; never use temp id in .eq()
                            const { error } = await supabase
                                .from('workout_exercises')
                                .update({
                                    sets: ex.sets,
                                    reps: ex.reps,
                                    comment: ex.comment ?? null,
                                    alternatives: ex.alternatives ?? [],
                                    exercise_order: i + 1
                                })
                                .eq('id', ex.id);
                            if (error) {
                                console.error('Error updating exercise', ex.id, error);
                                return false;
                            }
                        }
                    }

                    // Only delete exercises that are in DB but no longer in our list (don't delete newly inserted)
                    const realExIds = day.exercises.filter(e => !isTempId(e.id)).map(e => e.id);
                    const keepExIds = [...realExIds, ...insertedExIds];
                    const { data: existingEx } = await supabase.from('workout_exercises').select('id').eq('day_id', realDayId);
                    const exToDelete = (existingEx || []).filter((r: { id: string }) => !keepExIds.includes(r.id));
                    for (const row of exToDelete) {
                        await supabase.from('workout_exercises').delete().eq('id', (row as { id: string }).id);
                    }
                }
            }

            // 6. Reload program so all temp ids are replaced with real ids
            const updatedProgram = await loadCompleteProgram(currentProgram.id);
            setCurrentProgram(updatedProgram);
            setPrograms(prev => prev.map(p => (p.id === currentProgram.id ? updatedProgram : p)));
            return true;
        } catch (err) {
            console.error('Error saving program changes:', err);
            return false;
        }
    };

    // Move exercise up or down within a day (local only). Persisted when user clicks Save or Save and Finish.
    const moveExerciseInDay = (weekNumber: number, dayName: string, workoutExerciseId: string, direction: 'up' | 'down') => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return;

        const day = week.days.find(d => d.name === dayName);
        if (!day) return;

        const idx = day.exercises.findIndex(e => e.id === workoutExerciseId);
        if (idx < 0) return;
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === day.exercises.length - 1) return;

        const newExercises = [...day.exercises];
        const swapWith = direction === 'up' ? idx - 1 : idx + 1;
        [newExercises[idx], newExercises[swapWith]] = [newExercises[swapWith], newExercises[idx]];

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.map(w =>
                w.weekNumber === weekNumber
                    ? {
                        ...w,
                        days: w.days.map(d =>
                            d.name === dayName ? { ...d, exercises: newExercises } : d
                        )
                    }
                    : w
            )
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
    };

    // Reorder exercise within a day by moving to insertIndex (0-based, "before this position"). Used for drag-and-drop reorder.
    const reorderExerciseInDay = (weekNumber: number, dayName: string, workoutExerciseId: string, insertIndex: number) => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return;

        const day = week.days.find(d => d.name === dayName);
        if (!day) return;

        const currentIndex = day.exercises.findIndex(e => e.id === workoutExerciseId);
        if (currentIndex < 0) return;
        if (currentIndex === insertIndex) return;

        const exercises = day.exercises.filter(e => e.id !== workoutExerciseId);
        const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
        const clamped = Math.max(0, Math.min(adjustedIndex, exercises.length));
        const newExercises = [...exercises.slice(0, clamped), day.exercises[currentIndex], ...exercises.slice(clamped)];

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.map(w =>
                w.weekNumber === weekNumber
                    ? {
                        ...w,
                        days: w.days.map(d =>
                            d.name === dayName ? { ...d, exercises: newExercises } : d
                        )
                    }
                    : w
            )
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
    };

    // Remove exercise from day by workout exercise instance id (local only). Persisted when user clicks Save or Save and Finish.
    const removeExerciseFromDay = (weekNumber: number, dayName: string, workoutExerciseId: string) => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return;

        const day = week.days.find(d => d.name === dayName);
        if (!day) return;

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.map(w =>
                w.weekNumber === weekNumber
                    ? {
                        ...w,
                        days: w.days.map(d =>
                            d.name === dayName
                                ? { ...d, exercises: d.exercises.filter(e => e.id !== workoutExerciseId) }
                                : d
                        )
                    }
                    : w
            )
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
    };

    // Add a new week (local only). Persisted when user clicks Save or Save and Finish.
    const addWeek = (copyFromWeekNumber?: number) => {
        if (!currentProgram) return;

        const newWeekNumber = currentProgram.weeks.length + 1;

        let dayNames: string[] = [];
        if (currentProgram.structure === "weekly") {
            dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        } else if (currentProgram.structure === "rotating") {
            dayNames = ["Day A", "Day B", "Day C"];
        } else if (currentProgram.structure === "block") {
            dayNames = ["Block 1", "Block 2", "Block 3", "Block 4"];
        } else if (currentProgram.structure === "frequency") {
            dayNames = ["Full Body Session"];
        }

        const weekToCopy = copyFromWeekNumber ? currentProgram.weeks.find(w => w.weekNumber === copyFromWeekNumber) : null;

        const newDays: WorkoutDay[] = dayNames.map((name) => {
            const dayCopy = weekToCopy?.days.find(d => d.name === name);
            const exercises: WorkoutExercise[] = dayCopy
                ? dayCopy.exercises.map(ex => ({
                    id: nextTempId(),
                    exerciseId: ex.exerciseId,
                    exerciseName: ex.exerciseName,
                    sets: ex.sets,
                    reps: [...ex.reps],
                    comment: ex.comment,
                    alternatives: ex.alternatives ? [...ex.alternatives] : []
                }))
                : [];
            return {
                id: nextTempId(),
                name,
                exercises
            };
        });

        const newWeek: WorkoutWeek = {
            id: nextTempId(),
            weekNumber: newWeekNumber,
            days: newDays
        };

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: [...currentProgram.weeks, newWeek]
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
    };

    // Add a day to an existing week (local only). Persisted when user clicks Save or Save and Finish.
    const addDayToWeek = (weekNumber: number) => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return;

        const structure = currentProgram.structure;
        if (structure === "frequency" || structure === "block") return;

        let newDayName: string;
        if (structure === "rotating") {
            const lastDay = week.days[week.days.length - 1];
            const match = lastDay?.name.match(/^Day ([A-Z])$/);
            if (match) {
                const letter = match[1];
                const nextChar = letter === "Z" ? "A2" : String.fromCharCode(letter.charCodeAt(0) + 1);
                newDayName = `Day ${nextChar}`;
            } else {
                const nextLetter = String.fromCharCode(65 + (week.days.length % 26));
                newDayName = `Day ${nextLetter}`;
            }
        } else {
            const extraIndex = week.days.length - 6;
            newDayName = `Extra ${extraIndex > 0 ? extraIndex : 1}`;
        }

        const newDay: WorkoutDay = { id: nextTempId(), name: newDayName, exercises: [] };
        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.map(w =>
                w.weekNumber === weekNumber
                    ? { ...w, days: [...w.days, newDay] }
                    : w
            )
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => (p.id === currentProgram.id ? updatedProgram : p)));
    };

    // Remove a week/cycle (local only). Persisted when user clicks Save or Save and Finish.
    const removeWeek = (weekNumber: number) => {
        if (!currentProgram) return;

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.filter(w => w.weekNumber !== weekNumber)
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => (p.id === currentProgram.id ? updatedProgram : p)));
    };

    // Remove a day from a week (local only). Persisted when user clicks Save or Save and Finish.
    const removeDayFromWeek = (weekNumber: number, dayId: string) => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return;

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.map(w =>
                w.weekNumber === weekNumber
                    ? { ...w, days: w.days.filter(d => d.id !== dayId) }
                    : w
            )
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => (p.id === currentProgram.id ? updatedProgram : p)));
    };

    // Rename a day locally (e.g. "Day A" → "Monday"). Persisted to DB when user clicks Save or Finish.
    const updateDayName = (weekNumber: number, dayId: string, newName: string) => {
        if (!currentProgram) return;

        const trimmed = newName.trim();
        if (!trimmed) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        const day = week?.days.find(d => d.id === dayId);
        if (!week || !day || day.name === trimmed) return;

        const updatedProgram: WorkoutProgram = {
            ...currentProgram,
            weeks: currentProgram.weeks.map(w =>
                w.weekNumber === weekNumber
                    ? { ...w, days: w.days.map(d => (d.id === dayId ? { ...d, name: trimmed } : d)) }
                    : w
            )
        };
        setCurrentProgram(updatedProgram);
        setPrograms(prev => prev.map(p => (p.id === currentProgram.id ? updatedProgram : p)));
    };

    const selectProgram = (program: WorkoutProgram) => {
        setCurrentProgram(program);
    };

    const activateProgram = async (programId: string) => {
        try {
            if (!user) return;

            // First, delete any existing active program for this user
            await supabase
                .from('user_active_program')
                .delete()
                .eq('user_id', user.id);

            // Then insert the new active program
            const { error } = await supabase
                .from('user_active_program')
                .insert({
                    user_id: user.id,
                    program_id: programId,
                    activated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error activating program:', error);
                return;
            }

            // Update local state
            const programToActivate = programs.find(p => p.id === programId);
            if (programToActivate) {
                setActiveProgram(programToActivate);
            }
        } catch (err) {
            console.error('Error activating program:', err);
        }
    };

    const deactivateProgram = async () => {
        try {
            if (!user) return;

            // Remove the active program
            const { error } = await supabase
                .from('user_active_program')
                .delete()
                .eq('user_id', user.id);

            if (error) {
                console.error('Error deactivating program:', error);
                return;
            }

            // Update local state
            setActiveProgram(null);
        } catch (err) {
            console.error('Error deactivating program:', err);
        }
    };

    const deleteProgram = async (programId: string) => {
        try {
            // Delete from database (cascade will handle weeks, days, exercises)
            const { error } = await supabase
                .from('workout_programs')
                .delete()
                .eq('id', programId);

            if (error) {
                console.error('Error deleting program:', error);
                return;
            }

            // Remove from local state
            setPrograms(prev => prev.filter(p => p.id !== programId));

            // If the deleted program was the current program, clear it
            if (currentProgram?.id === programId) {
                setCurrentProgram(null);
            }
        } catch (err) {
            console.error('Error deleting program:', err);
        }
    };

    return {
        programs,
        currentProgram,
        setCurrentProgram,
        activeProgram,
        programName,
        setProgramName,
        programDescription,
        setProgramDescription,
        programStructure,
        setProgramStructure,
        createNewProgram,
        updateProgramInArray,
        addExerciseToDay,
        addExercisesToDay,
        updateExerciseLocal,
        moveExerciseInDay,
        reorderExerciseInDay,
        saveProgramChanges,
        removeExerciseFromDay,
        addWeek,
        addDayToWeek,
        removeWeek,
        removeDayFromWeek,
        updateDayName,
        selectProgram,
        activateProgram,
        deactivateProgram,
        deleteProgram,
        loading
    };
}; 