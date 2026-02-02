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

    const updateProgramInArray = async (updatedProgram: WorkoutProgram) => {
        try {
            // Update the program in database
            const { error: programError } = await supabase
                .from('workout_programs')
                .update({
                    name: updatedProgram.name,
                    description: updatedProgram.description,
                    structure: updatedProgram.structure
                })
                .eq('id', updatedProgram.id);

            if (programError) {
                console.error('Error updating program:', programError);
                return;
            }

            // Update local state
            setPrograms(prev => prev.map(p => p.id === updatedProgram.id ? updatedProgram : p));
            if (currentProgram?.id === updatedProgram.id) {
                setCurrentProgram(updatedProgram);
            }
        } catch (err) {
            console.error('Error updating program:', err);
        }
    };

    // Add exercise to a specific day
    const addExerciseToDay = async (exercise: Exercise, weekNumber: number, dayName: string) => {
        if (!currentProgram) return;

        try {
            // Find the week and day
            const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
            if (!week) return;

            const day = week.days.find(d => d.name === dayName);
            if (!day) return;

            // Get the next exercise order
            const nextOrder = day.exercises.length + 1;

            // Insert exercise into database
            const { error: exerciseError } = await supabase
                .from('workout_exercises')
                .insert([{
                    day_id: day.id,
                    exercise_id: exercise.id,
                    exercise_name: exercise.name,
                    sets: 3,
                    reps: [10, 10, 10],
                    exercise_order: nextOrder
                }])
                .select()
                .single();

            if (exerciseError) {
                console.error('Error adding exercise:', exerciseError);
                return;
            }

            // Reload the current program
            const updatedProgram = await loadCompleteProgram(currentProgram.id);
            setCurrentProgram(updatedProgram);

            // Update programs array
            setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
        } catch (err) {
            console.error('Error adding exercise:', err);
        }
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

    // Persist all exercise details (sets, reps, comment, alternatives) for the current program to the database.
    // Returns true if all updates succeeded, false otherwise.
    const saveProgramChanges = async (): Promise<boolean> => {
        if (!currentProgram) return false;

        try {
            for (const week of currentProgram.weeks) {
                for (const day of week.days) {
                    for (const exercise of day.exercises) {
                        const payload: Record<string, unknown> = {
                            sets: exercise.sets,
                            reps: Array.isArray(exercise.reps) ? exercise.reps : [],
                            comment: exercise.comment ?? null,
                            alternatives: exercise.alternatives ?? []
                        };
                        const { data, error } = await supabase
                            .from('workout_exercises')
                            .update(payload)
                            .eq('id', exercise.id)
                            .select('id')
                            .maybeSingle();

                        if (error) {
                            console.error('Error saving exercise', exercise.id, error);
                            return false;
                        }
                        if (!data) {
                            console.error('No row updated for exercise', exercise.id, '- check RLS or id');
                            return false;
                        }
                    }
                }
            }
            return true;
        } catch (err) {
            console.error('Error saving program changes:', err);
            return false;
        }
    };

    // Remove exercise from day
    const removeExerciseFromDay = async (weekNumber: number, dayName: string, exerciseId: string) => {
        if (!currentProgram) return;

        try {
            // Find the exercise in the current program
            const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
            if (!week) return;

            const day = week.days.find(d => d.name === dayName);
            if (!day) return;

            const exercise = day.exercises.find(e => e.exerciseId === exerciseId);
            if (!exercise) return;

            // Delete from database
            const { error } = await supabase
                .from('workout_exercises')
                .delete()
                .eq('id', exercise.id);

            if (error) {
                console.error('Error removing exercise:', error);
                return;
            }

            // Reload the current program
            const updatedProgram = await loadCompleteProgram(currentProgram.id);
            setCurrentProgram(updatedProgram);

            // Update programs array
            setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
        } catch (err) {
            console.error('Error removing exercise:', err);
        }
    };

    // Add a new week
    const addWeek = async (copyFromWeekNumber?: number) => {
        if (!currentProgram) return;

        try {
            const newWeekNumber = currentProgram.weeks.length + 1;

            // Create new week in database
            const { data: weekData, error: weekError } = await supabase
                .from('workout_weeks')
                .insert([{
                    program_id: currentProgram.id,
                    week_number: newWeekNumber
                }])
                .select()
                .single();

            if (weekError) {
                console.error('Error creating week:', weekError);
                return;
            }

            // Create days based on structure
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

            // If copying from another week, copy exercises
            if (copyFromWeekNumber) {
                const weekToCopy = currentProgram.weeks.find(w => w.weekNumber === copyFromWeekNumber);
                if (weekToCopy) {
                    for (const day of weekToCopy.days) {
                        const newDay = dayNames.find(d => d === day.name);
                        if (newDay) {
                            // Find the new day in database
                            const { data: newDayData } = await supabase
                                .from('workout_days')
                                .select('*')
                                .eq('week_id', weekData.id)
                                .eq('name', newDay)
                                .single();

                            if (newDayData) {
                                // Copy exercises
                                for (const exercise of day.exercises) {
                                    await supabase
                                        .from('workout_exercises')
                                        .insert([{
                                            day_id: newDayData.id,
                                            exercise_id: exercise.exerciseId,
                                            exercise_name: exercise.exerciseName,
                                            sets: exercise.sets,
                                            reps: exercise.reps,
                                            comment: exercise.comment,
                                            alternatives: exercise.alternatives,
                                            exercise_order: exercise.reps.length + 1
                                        }]);
                                }
                            }
                        }
                    }
                }
            }

            // Reload the current program
            const updatedProgram = await loadCompleteProgram(currentProgram.id);
            setCurrentProgram(updatedProgram);

            // Update programs array
            setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
        } catch (err) {
            console.error('Error adding week:', err);
        }
    };

    // Add a day to an existing week (for weekly: "Extra 1", "Extra 2"...; for rotating: "Day D", "Day E"...)
    const addDayToWeek = async (weekNumber: number) => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return;

        const structure = currentProgram.structure;
        if (structure === "frequency" || structure === "block") return; // only weekly and rotating support add day

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
            const extraCount = week.days.filter(d => d.name.startsWith("Extra ")).length + 1;
            newDayName = `Extra ${extraCount}`;
        }

        try {
            const nextOrder = week.days.length + 1;
            const { error: dayError } = await supabase
                .from('workout_days')
                .insert([{
                    week_id: week.id,
                    name: newDayName,
                    day_number: nextOrder,
                    day_order: nextOrder
                }]);

            if (dayError) {
                console.error('Error adding day:', dayError);
                return;
            }

            const updatedProgram = await loadCompleteProgram(currentProgram.id);
            setCurrentProgram(updatedProgram);
            setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
        } catch (err) {
            console.error('Error adding day:', err);
        }
    };

    // Remove a week/cycle (for rotating: "Remove cycle"; for weekly: "Remove week")
    const removeWeek = async (weekNumber: number) => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (!week) return;

        try {
            const { error } = await supabase
                .from('workout_weeks')
                .delete()
                .eq('id', week.id);

            if (error) {
                console.error('Error removing week:', error);
                return;
            }

            const updatedProgram = await loadCompleteProgram(currentProgram.id);
            setCurrentProgram(updatedProgram);
            setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
        } catch (err) {
            console.error('Error removing week:', err);
        }
    };

    // Remove a day from a week (for rotating: remove Day A/B/C/etc.; for weekly: remove Extra N)
    const removeDayFromWeek = async (weekNumber: number, dayId: string) => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        const day = week?.days.find(d => d.id === dayId);
        if (!week || !day) return;

        try {
            const { error } = await supabase
                .from('workout_days')
                .delete()
                .eq('id', dayId);

            if (error) {
                console.error('Error removing day:', error);
                return;
            }

            const updatedProgram = await loadCompleteProgram(currentProgram.id);
            setCurrentProgram(updatedProgram);
            setPrograms(prev => prev.map(p => p.id === currentProgram.id ? updatedProgram : p));
        } catch (err) {
            console.error('Error removing day:', err);
        }
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
        updateExerciseLocal,
        saveProgramChanges,
        removeExerciseFromDay,
        addWeek,
        addDayToWeek,
        removeWeek,
        removeDayFromWeek,
        selectProgram,
        activateProgram,
        deactivateProgram,
        deleteProgram,
        loading
    };
}; 